I have an electron desktop application with the vite typescript template

I want to create a very sleek, clean, modern script writing AI tool that helps me develop my youtube video scripts and tiktok short form video scripts

I want to write in markdown and have a live markdown preview show as I am writing in it

I want to be able to categorize and organize scripts and videos (example, youtube scripts, tiktok scripts)

I want an entire category for just brain dumping ideas for videos. I literally want to just type in ideas and have them get saved and shown in a section.

I want an AI system built in the app, using openrouter, in which I can
- switch models (start with the model “anthropic/claude-3.7-sonnet”)
- have the AI see the context of what I'm writing in the system prompt
- I want the AI system to be able to edit in line, just like cursor does.
- i want to be able to seed the AI system with some global prompt, and documents i can insert which get put into its system context
- Ensure every single output is done via structured output or forced function calling tool calls to ensure structured consistency

The app should be very modular, everything should be developed with seperation of concerns, as if you were a NASA level engineer.

For the database, use better-sqlite-3, local first approach

In the .env, we have OPENROUTER_API_KEY for open router calls