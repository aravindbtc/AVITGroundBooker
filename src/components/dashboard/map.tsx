"use client";

import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { avit_details } from "@/lib/data";

export function Map() {
    const position = avit_details.gps;
    // IMPORTANT: You need to create a .env.local file in the root of your project
    // and add your Google Maps API key like this:
    // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY"
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted text-center text-sm text-muted-foreground">
                <p>Google Maps API Key is missing.<br />Please add it to your .env.local file.</p>
            </div>
        );
    }
    
    return (
        <APIProvider apiKey={apiKey}>
            <div className="h-full w-full">
                <GoogleMap
                    defaultCenter={position}
                    defaultZoom={15}
                    mapId="avit-cricket-map"
                    className="rounded-lg"
                    disableDefaultUI={true}
                >
                    <AdvancedMarker position={position}>
                        <Pin 
                            background={"hsl(var(--primary))"}
                            borderColor={"hsl(var(--primary))"}
                            glyphColor={"hsl(var(--primary-foreground))"}
                        />
                    </AdvancedMarker>
                </GoogleMap>
            </div>
        </APIProvider>
    );
}
