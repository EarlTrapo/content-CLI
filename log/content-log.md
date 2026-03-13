
---
## [2026-03-13 11:55] | test logging works

**Raw idea:** test logging works

**Post variant 1 (short):**
Most teams don't have an AI problem. They have a logging problem. If you can't see what your system did yesterday, you can't improve what it does tomorrow.

**Post variant 2 (example-led):**
A founder I spoke with last week had 14 AI automations running across his business. No logs on any of them. He couldn't tell me which ones were working and which were quietly producing garbage. We added structured logging to each workflow. Within a week, he cut 5 automations that were doing nothing useful and doubled down on the 3 that were actually moving revenue. You can't compound what you can't measure. Logging isn't overhead. It's the foundation of every system that improves over time.

**Post variant 3 (question/observation):**
If your AI workflows stopped running right now, how long would it take you to notice? Most people build automations and never look at them again. No logs, no timestamps, no output tracking. That's not a system. That's a hope. The gap between "set it and forget it" and "set it and compound it" is one thing: visibility.

**Prospecting angle:**
- Target niche: Founders and operators running AI automations across sales, marketing, or ops
- Pain point: AI workflows running without any visibility into whether they're actually producing quality output or silently failing
- Outreach angle: I help teams add lightweight logging to their AI workflows so they can see what's working, cut what's not, and actually compound their results over time.
- Example prospect: A 15-person marketing agency using AI for content generation, email sequences, and lead scoring across multiple clients with no centralized way to track output quality
---

---
## [2026-03-13 12:04] | my current process for creating great AI videos

**Raw idea:** my current process for creating great AI videos 

recently I've found some strategies that help me create crazy realistic AI videos on Flow

a guiding principle is you always want to have a reference image that'll guide how you create the rest of the video

without a reference image, Veo will drift from your description of the chracter 

now, for a video where your character is in any form of motion, the reference image can't be used to generate the start of every scene, else it'll be heavily botched 

I also found that even when you extend a scene and prompt Veo to remember the voice, it still forgets a lot in the process

so the best solution is to create scene by scene and merge all via the scene builder into one video 

1: create the reference image - be imaginative here, give the model reference images for more inspiration, be very detailed with your prompt so the image comes out in very good, realistic quality. I use a reference prompt that's very detailed, you can paste this to chatGPT and tell it to rewrite it based on your desired features. once you have a result, tweak anything you don't like till you have the perfect image.

2: build a script - along with your image, you should already have a dialogue or an idea for what you want to do in the video. paste that script and dialogue into your favorite model and tell it to cut to 8 second scenes. for a scene, I've found that dialogue of 20-25 words is great and allows you use the slot efficiently and prevent awkward drags and pauses when your character speaks. 

3: using google Flow - create a new project in google flow and upload the above image. if you have more than one image that you like, you should upload them all, but one is enough. Flow uses some basic concepts that you must remember. use this as a reference so you know what you're doing.

- ingredients : this refers to the images you attach to your prompt. once you upload an image to the project files, just drag and drop into the prompt builder to lock it into the prompt.
- frames : you might become so good at image creation that you're able to create the scene start and end. in this case just upload the two images. veo will use the frame as guide and lock your scenes into those frames.
- x1, x2, x3, x4 : generating a video on flow costs 20 gemini credits. this feature tells flow how many videos you want. 2 videos cost 40 credits and so on. why should you spend more than 20 credits on a scene? generating 2 or more videos helps allows flow to be creative. 4 will lead to some cool results but it's an overkill. generate 2 videos per scene and pick the best one. after a solid number of scenes I often switch to x1 to complete the video. but at the start you want veo to render different ideas.

4: your google flow prompt - this will be unique to what you're working on. include action descriptions, dialogue, voice. tell flow to use the reference character and maintain features across different scenes. you can add for it to keep the camera static or not if you're okay with some movement. static is better though.

5: attaching scenes - you'll have to find out what works for you here through trial and error. a good practice is to save the last frame of every scene. then attach the reference image and the frame. use the reference image for features/description and the frame image for continuity. 

6: use imgupscaler - with the frame of a last scene, go to imgupscaler.ai to increase the quality so the video/picture quality stays consistent across the scenes. this is a common with flow problem. your first scene will be perfect because it uses the reference image directly, but it'll drop the quality as you start generating more scenes using frames from previous scenes. use imgupscaler to maintain the quality or keep the difference negligible. 

7: merge all videos using scenebuilder - each scene has a add to scenebuilder option. add the videos you've created in order to the scenebuilder to merge them. the scene builder is rather simple and doesn't have any crazy editing features. just join the videos. scenebuilder lets you trim videos in case veo botched the beginning or end which is coming. this is something you can use to optimize generating frames from each scene. you can trim the scene first if the last frame isn't ideal, generate the frame, and upscale it. 

8: trial and error - video generation is a trial and error game like anything involving prompts and AI. your job is to test - get feedback - iterate in the direction that works and away from what doesn't work. I would always ask claude/chatGPT how do I do this perfectly on google flow whenever I got a result I didn't like. but my best breakthroughs came when I just sat with flow and tested things. that's why there's the x2, x4 feature. veo is generating different formats to see which works best. that's the best mentality to have.

9: LLM choice - ChatGPT is a good companion to have for video creation. it does better with image prompt generation and also creates great images. it just has a better intuition for what you want. gemini images also work with very detailed prompts. minimax is underrated, it allows you use the best model for free. I recommend you check it out. for other video generation tools, I havent used Kling much or higgsfield, minimax also have a video generation model. mastering image generation, scene prompting and matching will help you adapt well to any model.

I hope you found this helpful.

**Post variant 1 (short):**
Most people generating AI videos keep prompting the same model hoping it gets better. The real unlock: treat your reference image as the source of truth and build scene by scene. Veo forgets. Your system shouldn't.

**Post variant 2 (example-led):**
AI video tools are impressive until you try to make a character consistent across 10 scenes. Here's what actually works after a lot of trial and error on Google Flow: Don't extend scenes. Build each one individually from a high-quality reference image, save the last frame, upscale it (imgupscaler keeps quality from degrading), then attach both the reference and the frame to your next prompt. Reference for features, frame for continuity. Merge everything in scenebuilder at the end. It sounds manual, but it's a system. And once you have it, you can produce realistic AI videos that don't drift into uncanny valley by scene three. The pattern applies beyond video: AI output degrades over steps. The fix is always anchoring each step back to a quality standard.

**Post variant 3 (question/observation):**
Why does AI video quality collapse after a few scenes? Same reason AI writing gets worse over a long conversation. The model drifts from your original intent. The people getting great results aren't using better tools. They're re-anchoring every single step to a reference. Context decay is the silent killer of every multi-step AI workflow. Are you solving for it or hoping the model figures it out?

**Prospecting angle:**
- Target niche: Content creators, marketing agencies, and consultants producing AI-generated video for brands or social
- Pain point: AI video tools promise realistic output but character consistency breaks down across scenes, leading to unusable results and wasted credits without a structured workflow
- Outreach angle: I built a repeatable system for producing consistent, realistic AI videos scene by scene, happy to walk you through the workflow if your team is experimenting with AI video for content.
- Example prospect: A 5-15 person digital marketing agency that wants to produce short-form video content for clients using AI tools but keeps getting inconsistent, unusable outputs
---

---
## [2026-03-13 12:27] | my current process for creating great AI videos

**Raw idea:** my current process for creating great AI videos 

recently I've found some strategies that help me create crazy realistic AI videos on Flow

a guiding principle is you always want to have a reference image that'll guide how you create the rest of the video

without a reference image, Veo will drift from your description of the chracter 

now, for a video where your character is in any form of motion, the reference image can't be used to generate the start of every scene, else it'll be heavily botched 

I also found that even when you extend a scene and prompt Veo to remember the voice, it still forgets a lot in the process

so the best solution is to create scene by scene and merge all via the scene builder into one video

**Post variant 1 (short):**
AI video without a reference image is just hoping the model remembers your character. It won't. Anchor every session or your output drifts.

**Post variant 2 (example-led):**
Most people prompt Veo and wonder why their character looks different in every scene. The fix is upstream. Start with a reference image, build each scene individually, then merge in the scene builder. Skip any step and the model drifts, forgets voices, shifts faces, breaks continuity. The output looks AI-generated in the bad way. The people getting cinematic results aren't using better prompts. They're using better structure. Same model, different system.

**Post variant 3 (question/observation):**
What if the reason your AI videos look inconsistent has nothing to do with your prompts? Reference image, scene-by-scene generation, scene builder merge. Three steps most people skip because they seem like extra work. They're not extra work. They're the work.

**Prospecting angle:**
- Target niche: Content creators, marketing agencies, and brand studios using AI video tools like Google Flow or Veo for client or product content
- Pain point: AI video output looks inconsistent and unprofessional because creators lack a structured production process, not because the tools are bad
- Outreach angle: I noticed your team is producing AI video content, and there's a specific three-step structure that eliminates the character drift and inconsistency most creators run into with Veo.
- Example prospect: A boutique video production agency that has started offering AI-generated video packages to clients but is getting inconsistent results and struggling to defend quality at scale
---

---
## [2026-03-13 12:40] | the book of Genesis details the process of

**Raw idea:** the book of Genesis details the process of how God created the earth. if God were an earthly being, he'd have needed to form things using his hands or assemble them from different parts. but God simply instructed the universe. because the word was God. let there be light is the clearest and most effective instruction there's ever been. 
the creation isn't the only time in history where the right instructions has led to massive outcomes. in a way, a founder's job is quite similar. great startups are reincarnations of God on earth — albeit slower. the best founders don't just build; they have vision, taste, and understand the different moving parts of their startup to give effective guidance and instructions. 
culturally, earth got its taste from God. everything in the beginning was to his likeness. there was no shame or sin, just people, animals and the rest of the universe coexisting in a shared space. this changed when its key figures listened to external advice.
Adam & Eve were like COOs in the garden of eden. their disobedience brought a different culture into the world. the culture of shame and want, which follows from shame. they sought to cloth themselves with leaves because they were ashamed of being naked. 
going back to the point about founders. creating a new earth, in this day and age, is our heavenly duty. it's the way we are most like God. the best way to do this in recent times has been through tech startups. technology is the vehicle for rapid change in all parts of the world. it's the vessel for making things much different than God initially designed. 
tech is also, for the most part, the least vain field. if a cosmetic or clothing company released a new line today, you could argue that they're preying on the ideas of shame and status. but a tech company simply solves problems for its users in real-time. their only source of revenue is actually being useful, not in being perceived as useful. apple might be the exception to this point. they've built a fortune off encouraging status games. but in their early stages, their major use was solving the problem of accessibility.
marketing plays a huge part in telling us what's useful. it'd be foolish to assume all the things you think are useful weren't marketed as such to you. but that's the way we can propagate change on a large scale. God had the universe to himself, we share it with billions of other people who are distracted by their own lives. breaking through the noise requires being louder or being targeted. 
where would we be now if Adam & Eve hadn't disobeyed God? we'd just be regular folks walking around naked and ignorant, unknown to lust and shame and want. God must have known that we were likely to go astray, and that's why he gave clear instructions telling us what to do with fruits in the garden. 
but when you deal with humans, you always deal with unpredictability and impulsiveness. this is another aspect where being a founder gets hard. God had created so many different parts of the universe. none of them disobeyed or were this is another aspect where being a founder gets hard. God had created so many different parts of the universe. none of them disobeyed or were prone to disobeying. the sun stayed in place, the rivers flowed as they should. but his first set of instructions to humans got disobeyed in mere hours. judgement always brings disagreement, that's the first lesson of humanity. 
or, at least, my interpretation of it. st lesson of humanity.

**Post variant 1 (short):**
God didn't build the earth with his hands. He instructed it. "Let there be light" is the most effective prompt ever written. Founders who understand this build differently.

**Post variant 2 (example-led):**
The best founders don't assemble companies piece by piece. They set vision, establish taste, and give instructions that the org moves toward. That's closer to Genesis than it is to management. God's first problem wasn't the universe, it was humans. The sun stayed in place. The rivers ran as designed. But his first set of instructions to humans got disobeyed within hours. Sound familiar? Your system will hold. Your team is the variable. Build accordingly.

**Post variant 3 (question/observation):**
What if the founder's real job isn't building, it's instructing? God didn't touch the earth to form it. The word was enough. The best operators I've watched work the same way. Clear vision, strong taste, precise guidance. The output reflects the instruction quality. What does that say about where most founders should actually be spending their time?

**Prospecting angle:**
- Target niche: Tech founders, early-stage startup operators, venture-backed builders
- Pain point: Founders who are stuck in execution mode instead of high-leverage instruction and vision, leading to teams that drift, culture that dilutes, and output that doesn't match the original intent
- Outreach angle: Your team's output is a direct reflection of the clarity of your instructions, and most founders are too deep in the work to see where the signal is breaking down.
- Example prospect: A Series A founder with a 10-person team who is still rewriting deliverables himself because the output never quite matches what he had in mind
---
