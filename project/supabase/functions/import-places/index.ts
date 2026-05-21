import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Place {
  name: string;
  type: "restaurant" | "bar" | "museum" | "park" | "theater";
  category?: string;
  cuisine?: string;
  description: string;
  duration: number;
  experience_type: string[];
  budget: string;
  budget_reason: string;
  ambiance: string[];
  place_type: string[];
  discovery_level: string;
  ideal_moment: string;
  why_in_day: string;
  reservable: boolean;
  opening_days: string[];
  opening_period: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { places, city = "Paris" } = body;

    if (!Array.isArray(places)) {
      return new Response(
        JSON.stringify({ error: "Places must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Transform and validate places
    const transformedPlaces: any[] = places.map((place: Place) => ({
      name: place.name,
      type: place.type,
      category: place.category || null,
      cuisine: place.cuisine || null,
      description: place.description,
      duration: place.duration,
      experience_type: place.experience_type || [],
      budget: place.budget,
      budget_reason: place.budget_reason || null,
      ambiance: place.ambiance || [],
      place_type: place.place_type || [],
      discovery_level: place.discovery_level || "mix des deux",
      ideal_moment: place.ideal_moment || null,
      why_in_day: place.why_in_day || null,
      reservable: place.reservable || false,
      opening_days: place.opening_days || [],
      opening_period: place.opening_period || "toute l'année",
      city: city,
    }));

    // Batch insert (Supabase supports up to 1000 rows per request)
    const { data, error } = await supabase
      .from("places")
      .insert(transformedPlaces)
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: data?.length || 0,
        message: `Successfully imported ${data?.length || 0} places`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
