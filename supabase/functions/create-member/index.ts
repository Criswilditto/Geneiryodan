import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", ""));
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profErr } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profErr || !profile || profile.role !== "dictador") {
      return new Response(JSON.stringify({ error: "Solo el Dictador puede gestionar miembros" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    if (req.method === "POST") {
      const { username, password, custom_role_id } = await req.json();
      if (!username || !password) {
        return new Response(JSON.stringify({ error: "Faltan datos: username, password" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a synthetic email from username
      const safeName = username.toLowerCase().replace(/[^a-z0-9]/g, "");
      const email = `${safeName}@geneiryodan.local`;

      // Check if username already exists
      const { data: existing } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "Ese nombre de usuario ya existe" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const insertData: Record<string, unknown> = {
        id: newUser.user.id,
        username,
        role: "miembro",
        must_change_password: true,
      };
      if (custom_role_id) insertData.custom_role_id = custom_role_id;

      const { error: profInsertErr } = await adminClient
        .from("profiles")
        .insert(insertData);

      if (profInsertErr) {
        await adminClient.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: profInsertErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, userId: newUser.user.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const { user_id } = await req.json();
      if (!user_id) {
        return new Response(JSON.stringify({ error: "Falta user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent self-deletion
      if (user_id === userData.user.id) {
        return new Response(JSON.stringify({ error: "No puedes eliminar tu propia cuenta" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete profile first (RLS is bypassed with service role)
      const { error: delProfErr } = await adminClient
        .from("profiles")
        .delete()
        .eq("id", user_id);

      if (delProfErr) {
        return new Response(JSON.stringify({ error: delProfErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete the auth user
      const { error: delUserErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (delUserErr) {
        return new Response(JSON.stringify({ error: delUserErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
