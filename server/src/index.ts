import { env } from "./lib/env.js";
import { createApp } from "./app.js";
import { startFollowUpCron } from "./services/email/followupCron.js";
import { startMarketResearchCron } from "./services/ai/marketResearch.js";

const app = createApp();

app.listen(env.port, () => {
  startFollowUpCron();
  startMarketResearchCron();
  console.log(`Skill-Track server listening on http://localhost:${env.port}`);
});
