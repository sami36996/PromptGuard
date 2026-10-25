"use client";

import { useEffect } from "react";
import { getStats } from "@/api/client";

export default function Home() {

    useEffect(() => {

        async function test(){

            try {

                const data = await getStats();

                console.log("FASTAPI RESPONSE:", data);

            } catch(error){

                console.error(error);

            }

        }

        test();

    }, []);


    return (
        <div>
            API Test
        </div>
    );
}