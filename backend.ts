import { GenezioDeploy, GenezioMethod } from "@genezio/types";
import fetch from "node-fetch";
import { MailService } from "@genezio/email-service";

interface Job {
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobExcerpt: string;
  url: string;
}

interface Data {
  jobs: Job[];
}

@GenezioDeploy()
export class BackendService {
  constructor() {}

  @GenezioMethod({ type: "cron", cronString: "* * * * *" })
  async dailyCron() {
    try {
      const response = await fetch("https://jobicy.com/api/v2/remote-jobs");
      if (!response.ok) {
        throw new Error("Failed to fetch remote jobs");
      }

      const data = (await response.json()) as Data;

      const jobHTML = data.jobs
        .map(
          (job: Job) => `
      <div style="margin-bottom: 20px; border: 1px solid #ccc; padding: 20px;">
        <h2>${job.jobTitle} at ${job.companyName}</h2>
        <img src="${job.companyLogo}" alt="${job.companyName} Logo" style="max-width: 200px;">
        <p><strong>Job Industry:</strong> ${job.jobIndustry.join(", ")}</p>
        <p><strong>Job Type:</strong> ${job.jobType.join(", ")}</p>
        <p><strong>Job Location:</strong> ${job.jobGeo}</p>
        <p>${job.jobExcerpt}</p>
        <p><a href="${job.url}" target="_blank">Read More</a></p>
      </div>
    `,
        )
        .join("");

      const emailResponse = await MailService.sendMail({
        emailServiceToken: process.env.EMAIL_SERVICE_TOKEN!,
        to: process.env.TO!,
        subject: "Your daily remote jobs list",
        html: jobHTML,
      });

      if (!emailResponse.success) {
        return emailResponse.errorMessage;
      }

      console.log("Email Sent!");
    } catch (error) {
      console.error("Error fetching remote jobs:");
      throw error;
    }
  }
}
