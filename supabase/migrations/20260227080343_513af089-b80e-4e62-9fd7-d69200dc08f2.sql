
-- Comprehensive admin analytics function
CREATE OR REPLACE FUNCTION public.get_admin_comprehensive_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_total_users bigint;
  v_active_users_7d bigint;
  v_trial_users bigint;
  v_basic_subscribers bigint;
  v_premium_subscribers bigint;
  v_annual_subscribers bigint;
  v_total_paid bigint;
  v_churned_30d bigint;
  v_new_users_30d bigint;
  v_total_scans bigint;
  v_high_risk_scans bigint;
  v_avg_scans_per_user numeric;
  v_leads_created bigint;
  v_trial_starts_30d bigint;
  v_failed_payments_30d bigint;
  v_upgrades_30d bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- USER METRICS
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  
  SELECT COUNT(*) INTO v_active_users_7d FROM public.profiles
    WHERE last_scan_timestamp > now() - interval '7 days';
  
  SELECT COUNT(*) INTO v_trial_users FROM public.profiles
    WHERE (subscription_tier IS NULL OR subscription_tier = 'free') AND trial_expired = false;
  
  SELECT COUNT(*) INTO v_basic_subscribers FROM public.profiles
    WHERE subscription_tier = 'basic';
  
  SELECT COUNT(*) INTO v_premium_subscribers FROM public.profiles
    WHERE subscription_tier = 'premium';
  
  SELECT COUNT(*) INTO v_annual_subscribers FROM public.profiles
    WHERE subscription_tier = 'annual';
  
  v_total_paid := v_basic_subscribers + v_premium_subscribers + v_annual_subscribers;
  
  SELECT COUNT(*) INTO v_new_users_30d FROM public.profiles
    WHERE created_at > now() - interval '30 days';
  
  -- Churned = users whose subscription expired in last 30d (proxy via email_log)
  SELECT COUNT(DISTINCT user_id) INTO v_churned_30d FROM public.email_log
    WHERE email_type = 'subscription_deleted' AND sent_at > now() - interval '30 days';

  -- SCAN METRICS
  SELECT COUNT(*) INTO v_total_scans FROM public.scan_history;
  
  SELECT COALESCE(ROUND(v_total_scans::numeric / NULLIF(v_total_users, 0), 1), 0) INTO v_avg_scans_per_user;
  
  SELECT COUNT(*) INTO v_high_risk_scans FROM public.scan_history
    WHERE health_score IS NOT NULL AND health_score < 40;

  -- MARKETING METRICS
  SELECT COUNT(*) INTO v_leads_created FROM public.legal_leads;
  
  SELECT COUNT(*) INTO v_trial_starts_30d FROM public.profiles
    WHERE created_at > now() - interval '30 days';

  -- REVENUE PROXIES (from email_log events)
  SELECT COUNT(*) INTO v_failed_payments_30d FROM public.email_log
    WHERE email_type = 'payment_failed' AND sent_at > now() - interval '30 days';
  
  SELECT COUNT(*) INTO v_upgrades_30d FROM public.email_log
    WHERE email_type IN ('subscription_created', 'subscription_updated') AND sent_at > now() - interval '30 days';

  -- Build top scanned products
  -- Build risk distribution
  result := jsonb_build_object(
    'user_metrics', jsonb_build_object(
      'total_users', v_total_users,
      'active_users_7d', v_active_users_7d,
      'trial_users', v_trial_users,
      'basic_subscribers', v_basic_subscribers,
      'premium_subscribers', v_premium_subscribers,
      'annual_subscribers', v_annual_subscribers,
      'total_paid', v_total_paid,
      'conversion_rate', CASE WHEN v_total_users > 0 THEN ROUND((v_total_paid::numeric / v_total_users) * 100, 2) ELSE 0 END,
      'churn_rate', CASE WHEN v_total_paid + v_churned_30d > 0 THEN ROUND((v_churned_30d::numeric / (v_total_paid + v_churned_30d)) * 100, 2) ELSE 0 END,
      'new_users_30d', v_new_users_30d
    ),
    'scan_metrics', jsonb_build_object(
      'total_scans', v_total_scans,
      'avg_scans_per_user', v_avg_scans_per_user,
      'high_risk_count', v_high_risk_scans,
      'risk_distribution', (
        SELECT jsonb_build_object(
          'safe', COUNT(*) FILTER (WHERE health_score >= 70),
          'moderate', COUNT(*) FILTER (WHERE health_score >= 40 AND health_score < 70),
          'high_risk', COUNT(*) FILTER (WHERE health_score < 40)
        ) FROM public.scan_history WHERE health_score IS NOT NULL
      ),
      'top_products', (
        SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
          SELECT product_name, brand, COUNT(*) as scan_count
          FROM public.scan_history
          WHERE product_name IS NOT NULL
          GROUP BY product_name, brand
          ORDER BY scan_count DESC
          LIMIT 10
        ) t
      )
    ),
    'revenue_metrics', jsonb_build_object(
      'mrr', (v_basic_subscribers * 9.99) + (v_premium_subscribers * 24.99) + ROUND(v_annual_subscribers::numeric * 74.99 / 12, 2),
      'arr', ((v_basic_subscribers * 9.99) + (v_premium_subscribers * 24.99)) * 12 + (v_annual_subscribers * 74.99),
      'failed_payments_30d', v_failed_payments_30d,
      'upgrades_30d', v_upgrades_30d,
      'upgrade_rate', CASE WHEN v_new_users_30d > 0 THEN ROUND((v_upgrades_30d::numeric / v_new_users_30d) * 100, 2) ELSE 0 END
    ),
    'marketing_metrics', jsonb_build_object(
      'leads_created', v_leads_created,
      'trial_starts_30d', v_trial_starts_30d,
      'conversion_funnel', (
        SELECT jsonb_build_object(
          'total_scans', COUNT(*) FILTER (WHERE event_category = 'legal_consultation' OR TRUE),
          'cta_views', COUNT(*) FILTER (WHERE event_type = 'toxic_cta_view'),
          'cta_clicks', COUNT(*) FILTER (WHERE event_type = 'toxic_cta_click'),
          'form_submits', COUNT(*) FILTER (WHERE event_type = 'form_submit'),
          'leads', COUNT(*) FILTER (WHERE event_type = 'lead_created')
        ) FROM public.analytics_events
        WHERE event_category = 'legal_consultation' AND created_at > now() - interval '30 days'
      )
    )
  );

  RETURN result;
END;
$function$;
