import { getStats } from "./client";


async function testAPI(){

    const data = await getStats();

    console.log(data);

}

testAPI();