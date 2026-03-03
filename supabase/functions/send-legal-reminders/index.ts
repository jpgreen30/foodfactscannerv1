import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Ingredient {
  name: string;
  riskLevel?: string;
}

interface UserWithToxicScans {
  user_id: string;
  toxic_count: number;
  last_scan_date: string;
  has_consultation: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dryRun = false, userId: specificUserId } = await req.json().catch(() => ({}));

    console.log('[Legal Reminders] Starting notification job', { dryRun, specificUserId });

    // Step 1: Get all users with toxic scans
    let scansQuery = supabase
      .from('scan_history')
      .select('user_id, verdict, ingredients, created_at');

    if (specificUserId) {
      scansQuery = scansQuery.eq('user_id', specificUserId);
    }

    const { data: allScans, error: scansError } = await scansQuery;

    if (scansError) {
      console.error('[Legal Reminders] Error fetching scans:', scansError);
      throw scansError;
    }

    console.log(`[Legal Reminders] Found ${allScans?.length || 0} total scans`);

    // Filter to toxic scans and group by user
    const userToxicScans = new Map<string, { count: number; lastScanDate: string }>();

    for (const scan of allScans || []) {
      const isToxic = (() => {
        if (scan.verdict === 'avoid') return true;
        const ingredients = scan.ingredients as unknown as Ingredient[] | null;
        if (ingredients && Array.isArray(ingredients)) {
          return ingredients.some((i) =>
            ['high', 'moderate', 'danger', 'caution'].includes(i.riskLevel || '')
          );
        }
        return false;
      })();

      if (isToxic && scan.user_id) {
        const existing = userToxicScans.get(scan.user_id);
        if (existing) {
          existing.count++;
          if (new Date(scan.created_at) > new Date(existing.lastScanDate)) {
            existing.lastScanDate = scan.created_at;
          }
        } else {
          userToxicScans.set(scan.user_id, { count: 1, lastScanDate: scan.created_at });
        }
      }
    }

    console.log(`[Legal Reminders] Found ${userToxicScans.size} users with toxic scans`);

    if (userToxicScans.size === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users with toxic scans found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get users who have already submitted legal consultations
    const userIds = Array.from(userToxicScans.keys());
    const { data: existingLeads, error: leadsError } = await supabase
      .from('legal_leads')
      .select('user_id')
      .in('user_id', userIds)
      .eq('consultation_requested', true);

    if (leadsError) {
      console.error('[Legal Reminders] Error fetching leads:', leadsError);
      throw leadsError;
    }

    const usersWithConsultations = new Set(existingLeads?.map(l => l.user_id) || []);
    console.log(`[Legal Reminders] ${usersWithConsultations.size} users already have consultations`);

    // Step 3: Filter to users who need reminders
    const usersToNotify: UserWithToxicScans[] = [];
    for (const [userId, data] of userToxicScans) {
      if (!usersWithConsultations.has(userId)) {
        usersToNotify.push({
          user_id: userId,
          toxic_count: data.count,
          last_scan_date: data.lastScanDate,
          has_consultation: false,
        });
      }
    }

    console.log(`[Legal Reminders] ${usersToNotify.length} users eligible for reminders`);

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All users with toxic scans have already consulted', 
          sent: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Check for users with active device tokens
    const { data: activeDevices, error: devicesError } = await supabase
      .from('device_tokens')
      .select('user_id')
      .in('user_id', usersToNotify.map(u => u.user_id))
      .eq('is_active', true);

    if (devicesError) {
      console.error('[Legal Reminders] Error fetching devices:', devicesError);
      throw devicesError;
    }

    const usersWithDevices = new Set(activeDevices?.map(d => d.user_id) || []);
    const eligibleUsers = usersToNotify.filter(u => usersWithDevices.has(u.user_id));

    console.log(`[Legal Reminders] ${eligibleUsers.length} users have active devices`);

    // Step 5: Send notifications
    const results = [];
    for (const user of eligibleUsers) {
      const title = '⚠️ Toxic Products in Your History';
      const body = user.toxic_count === 1
        ? 'You scanned a product with harmful ingredients. You may be eligible for compensation. Tap to learn more.'
        : `You've scanned ${user.toxic_count} products with harmful ingredients. You may be eligible for significant compensation. Tap to learn more.`;

      if (dryRun) {
        console.log(`[Legal Reminders] DRY RUN - Would notify user ${user.user_id}:`, { title, body });
        results.push({ user_id: user.user_id, status: 'dry_run', toxic_count: user.toxic_count });
        continue;
      }

      try {
        // Call the existing send-push-notification function
        const { data: pushResult, error: pushError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: user.user_id,
            title,
            body,
            type: 'dangerous_product',
            data: {
              action: 'open_legal_help',
              toxic_count: user.toxic_count,
              url: '/legal-help',
            },
          },
        });

        if (pushError) {
          console.error(`[Legal Reminders] Error sending to ${user.user_id}:`, pushError);
          results.push({ user_id: user.user_id, status: 'error', error: pushError.message });
        } else {
          console.log(`[Legal Reminders] Sent notification to ${user.user_id}:`, pushResult);
          results.push({ user_id: user.user_id, status: 'sent', toxic_count: user.toxic_count });
        }
      } catch (error) {
        console.error(`[Legal Reminders] Exception for ${user.user_id}:`, error);
        results.push({ user_id: user.user_id, status: 'exception', error: String(error) });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent' || r.status === 'dry_run').length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${eligibleUsers.length} users`,
        sent: sentCount,
        total_with_toxic_scans: userToxicScans.size,
        already_consulted: usersWithConsultations.size,
        eligible_for_reminder: usersToNotify.length,
        with_active_devices: eligibleUsers.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Legal Reminders] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
