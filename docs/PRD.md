# Vantage: Product Requirements Document (PRD)
 
## 1. Overview
 
Vantage is a web app that works like a small marketing team powered by AI agents. A business owner enters what they do, their website, and a few competitors. Vantage then researches their real market, their real competitors, and the kind of customer they want to reach. It uses that research to build a complete marketing campaign, including a clear position in the market, a strategy, slogans, and ad copy. Every recommendation is backed by real sources that Vantage found during the run, so the output is grounded in facts instead of guesses.
 
The point of the product is simple. Small and local businesses cannot afford a marketing agency and get little value from generic AI tools. Vantage gives them the research-first work a good marketer would do, at a price they can afford.
 
## 2. Problem and Background
 
Small businesses, local businesses, and early startups all need good marketing, but every option open to them is weak in some way.
 
A marketing agency does real, custom work, but it costs roughly two to five thousand dollars a month, which most small businesses cannot justify. Generic AI tools like ChatGPT, Jasper, and Copy.ai are cheap, but they only generate text. They do not study the business's real competitors, they do not cite sources, and they hand the same generic ideas to everyone. Doing the marketing alone means guessing, because most owners are experts in their trade, not in marketing.
 
So there is a clear gap in the market. Nothing affordable does the part that actually matters, which is the research-first work a good marketer does. That work means studying the real market, reading what competitors already say, finding the angle nobody has claimed, and turning all of it into a campaign the business can use right away. Vantage fills that gap.
 
Supporting signal: agencies are priced out of reach for small businesses, general AI writing tools are now common but produce shallow and ungrounded output, and small business owners increasingly use short-form video and social channels where a sharp, specific idea matters more than a big budget. The opportunity is a tool that is cheaper than an agency and far more grounded and specific than a plain chatbot.
 
## 3. Goals and Success Metrics
 
The main goal is to prove that an AI product can produce marketing that a real small business owner finds clearly more useful than what they would get from a general AI tool, and to do it as a well-built, low-cost, portfolio-quality application.
 
Success metrics, written as targets to measure against:
 
Quality. At least 7 out of the first 10 test users say the Vantage report is clearly better than what they would get from ChatGPT.
 
Groundedness. At least 90 percent of the creative recommendations in a report point to a real source that was found during the run. This is measured by the evaluation harness.
 
Reliability. A full report finishes without failure in at least 95 percent of runs.
  
Adoption, measured later once the product is live. Reach 50 sign-ups in the first three months, convert at least 5 percent of free-sample users to a paid report, and land the first 5 paying customers.
 
These are honest targets for a solo build, not guarantees. They exist so progress can be measured instead of guessed.
 
## 4. Target Users and Personas
 
The main users are owners and operators of small or local businesses, plus solo founders of early startups. They cannot afford an agency, are not marketing experts, and want something better than a blank chatbot. Vantage adapts its research and output to the type of business entered, so a dentist and an online clothing brand get different channels, language, and ideas.
 
Key persona: Maria, salon owner. Maria is in her forties and runs a small two-chair salon. She is great at her craft but has no marketing training and no time. She wants more local clients but cannot spend thousands on an agency. She has tried ChatGPT and found the ideas too generic to use. Maria is the key persona because local service businesses are the sharpest fit for Vantage, and if the product delights Maria, it works.
 
Persona two: Devon, restaurant owner. Devon is in his thirties and recently opened a restaurant. He is surrounded by established competitors and needs both foot traffic and a distinct identity. He wants ready-to-use ideas and copy, not marketing theory.
 
Persona three: Priya, startup founder. Priya is in her late twenties and is the technical founder of an early software product. She has no marketing team and needs a clear position that helps her stand out in a crowded space.
 
## 5. User Stories
 
As Maria, a salon owner, I want to enter my website and three competitors so that I get a campaign tailored to my local market.
 
As a user, I want to see the sources behind each recommendation so that I can trust the ideas are real and not made up.
 
As Devon, a restaurant owner, I want ready-to-paste ad copy and slogans, not vague advice, so that I can actually run the campaign.
 
As Priya, a startup founder, I want a position that nobody else in my space owns so that I can stand out.
 
As a first-time user, I want to run one free sample before I pay so that I can see the value first.
 
As a paying user, I want to run full reports and save them so that I can revisit them later.
 
As a user, I want to review and edit the strategy before the final campaign is generated so that I stay in control.
 
As a user, I want to export the finished campaign as a document so that I can use it outside the app.
 
As a returning user, I want to re-run a saved project when my competitors change so that my campaign stays current.
 
As a careful user, I want to see why an idea is strong, including the pattern it uses, so that it feels like a professional made it.
 
## 6. Features and Requirements
 
This section lists what the product must do. It is prioritized at the end using the MoSCoW method, which sorts features into Must have, Should have, Could have, and Will not have.
 
First, the user enters their business description, website, and competitor links. A planning agent decides what to research. Research agents then work at the same time, where one studies the competitors by reading their live websites, one studies the ideal customer, and one studies the wider market and trends. Each agent gathers real evidence and records the source for every finding. A synthesis agent combines the research into a clear brief with a positioning gap analysis, which points out what every competitor already says and what open angle nobody owns. A creative director agent then pulls proven creative patterns from a curated library that Vantage owns and reshapes them to fit this business, this goal, and current trends. A reviewer agent scores every idea against a quality checklist, rejects weak or unsupported ideas, and asks for better versions. The user reviews and approves the strategy, and the finished campaign can be exported.
 
The core features:
 
Business input. A form for the business description, website URL, and competitor URLs, with validation, and safe fetching of competitor pages.
 
The research and campaign pipeline. The multi-agent system described above, which plans research, gathers evidence in parallel, synthesizes a brief, generates creative, and reviews its own work. This is the heart of the product.
 
Cited output. Every recommendation shows the sources behind it, so the user can see it came from real research.
 
The creative director library. A curated, structured library of proven creative patterns that the creative agent draws from. A plain AI model does not have this, and it is a major reason the output is genuinely creative rather than generic.
 
The reviewer and quality filter. An agent that scores each idea against a clear rubric, rejects generic or unsupported ideas, and requests a stronger version.
 
Free sample and paid report. Every user can run one short free sample. The full report, with deeper research and the complete campaign, is the paid product.
 
Accounts and saved reports. Users sign in, and their reports are saved so they can return to them and run them again.
 
Exportable deliverable. The finished campaign can be exported as a document, for example a PDF or copy-ready text.
 
Prioritization (MoSCoW): Must have: business input, the multi-agent research and campaign pipeline, cited output, the creative director library, one free sample, accounts, and an exportable report. Should have: the human review and edit step, saved and re-runnable projects, and showing the quality score behind each idea. Could have: extra research sources such as Reddit, Google Trends, and public demographic data, and paid billing through Stripe. Will not have in version one: running ads, image or video creation, team accounts, outside integrations, and any features that touch sensitive personal data.
 
## 7. UX and Design Notes
 
The interface should feel clean, modern, and trustworthy, because the product is asking users to trust its recommendations. The core screens are a landing page, a sign-in page, a dashboard of past reports, a new-report form, a live progress view while the agents work, a report view that shows the brief, the strategy, and the creative with sources and quality scores visible, and a review screen where the user can approve or edit.
 
Detailed visual design and wireframes are not finalized yet and will be produced during the frontend phase using design tools. One firm rule is set now: the app will use a single, consistent visual theme, because inconsistency is what makes an app look cheap and unfinished. Showing the sources and the quality score inside the report view is a design requirement, not optional, because visible proof is what separates Vantage from a generic tool.
 
## 8. Assumptions and Dependencies
 
Assumptions are things believed to be true that the plan depends on. If one turns out false, the plan may need to change.
 
It is assumed that small business owners will trust and value output more when it shows real sources, so the product leads with cited evidence.
 
It is assumed that a curated library of proven creative patterns, combined with live research, produces better and more original ideas than a plain model, so the library is central to the product.
 
It is assumed that most target users will access Vantage on a laptop or desktop when working on their marketing, so the design is built for that first.
 
It is assumed that competitor information the product needs is available on public web pages.
 
Dependencies are outside services and tools the product relies on. Vantage depends on an AI model provider for the agents, a web search service for research, a database and sign-in service, a frontend host, and a backend host. If any of these change their pricing or limits, the plan may need to adjust. The product also depends on the curated creative library being prepared before the creative agent can work.
 
## 9. Constraints
 
Cost. The main cost is AI model usage, so the app uses a cheaper model for research steps and a stronger model only for synthesis and creative work. A hard spending cap is set on the AI account before any building starts, so a surprise bill is not possible.
 
Technology. The frontend is built in React and TypeScript and hosted on Vercel. The backend is built in Python with FastAPI and runs the agents using LangGraph, hosted on Render. The database, sign-in, and creative library storage use Supabase. Web search uses a service with a free tier.
 
Legal and compliance. Vantage never handles patient or health data, which keeps it out of heavy regulation. The product does not promise guaranteed marketing results, which keeps it honest under advertising rules. AI-generated content is labeled as such. When reading competitor pages, Vantage only reads public pages and respects each site's rules.
 
## 10. Out of Scope
 
Being clear about what is not being built is what keeps the first version small enough to finish. These items are left out of version one on purpose.
 
Running or buying the ads. Vantage produces the campaign, but it does not place ads on Google or Meta. That is a large future step.
 
Image and video creation. Free tools already do this, so Vantage does not need to.
 
Analytics dashboards and A/B testing. Tracking performance over time is a separate, later product area.
 
Team accounts and outside integrations. The first version is built for a single user per account.
 
Any handling of patient, health, or other sensitive personal data. This is a firm rule that keeps the product simple and low-risk.
 
## 11. Risks and Mitigations
 
The market is crowded. Many AI marketing tools exist, so Vantage does not compete on writing text. It competes on four things a plain model cannot do, which are live cited research on the user's real market, a curated creative library, a self-correcting review loop, and a finished saved workflow. Any one alone is easy to copy, but all four together are not.
 
AI cost could run away. Long agent loops can burn money. Mitigation: a spending cap on the account, a limit on how many times the agents can loop, a cap on output length, and a cheaper model for most steps.
 
Marketing statistics can be exaggerated. Many famous campaign numbers online are inflated. Mitigation: every campaign in the creative library has a source and a confidence rating, plus a list of contested numbers the tool must never state as fact.
 
Scope creep could stop the project from finishing. Mitigation: the strict out-of-scope list above. Extra ideas wait until version one is live.
 
The product depends on the live web. Websites change and searches cost money. Mitigation: cache results so the same lookup is not paid for twice, and let optional data sources fail quietly without breaking a report.
 
## 12. Timeline and Milestones
 
The build follows a standard software process over roughly ten weeks, in weekly stages. It starts with setup and this plan, then architecture, then the agent core, then the API and sign-in, then security, then quality testing of the agents, then the user interface, then full testing, then automated deployment, then the live launch and legal pages, and finally ongoing improvement. Each stage ends with something that works and is saved to version control, so progress is always real and visible. Exact dates are set as the build begins.
 
## 13. Open Questions
 
These are not decided yet and will be resolved during the build.
 
What exactly should the one free sample include, so it shows real value without giving away the full paid report.
 
What is the right price for the paid report or subscription, and should it be per report or monthly.
 
Which export format matters most to users first, a PDF or copy-ready text.
 
How much of the strategy should the user be able to edit before the final campaign is generated.
 
Which extra research sources, if any, are worth adding after launch, based on what real users ask for.