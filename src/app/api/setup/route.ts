import { up } from "@auth/d1-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
    try {
        const { env } = await getCloudflareContext({async: true})
        await up(env.DB)
        console.log("Migration completed")
    } catch (e: unknown) {
        if (e instanceof Error) {
            const causeMessage = e.cause instanceof Error ? e.cause.message : String(e.cause);
            console.log(causeMessage, e.message)
        }
    }
    return new Response('Migration completed');
}
