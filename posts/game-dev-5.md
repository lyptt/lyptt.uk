<!--{"date":"2019-06-09T23:24:12.333Z","title":"Game Dev - Part 5"}-->

For the past week I've been doing a lot of the prep work necessary to get
the core gameplay elements built out. There were a few tweaks along the
way to the renderer in order to further improve performance too.

Without further ado, let's get going!

### Inventory Data

One of the big updates to the engine was to finish sending down a player's
inventory data to the client. The very first message after confirming a
player's login details is the Character Details message. This sends down
all of the core game state the client needs to sync up to the server's
persisted character state.

The server already had support for loading in all of the inventory details,
however the network message for Character Details needed updating to be
able to send this information to the client.

Fortunately I made this easy for myself by building in an easy to use
binary serialiser a few weeks back, so this was just a case of adding
additional subpackets and making sure the client could load them into
its internal game state.

### Scripted UI

This game's inevitably going to have a lot of UI interactions. Up until
now I've been hardcoding this UI in C++, but this makes things pretty
verbose, and prevents non-coders from working on the more visual elements
of the game.

I decided now was a good time to add Lua to the game client, and build a
really simple set of UI APIs so that dialogs could be scripted entirely
in Lua. This didn't take too long thanks to being able to share a chunk
of code with the server's Lua implementation.

I had a few issues with interacting with the Lua VM, I was getting
segfaults at certain points. This ended up being down to popping too
many entries off of Lua's stack when calling Lua functions from C++.

It's a shame that Lua uses this approach to passing data back and forth,
as it's really difficult to inspect the stack and know when you should
pop off the stack and when you shouldn't. Fortunately this didn't waste
too much time, so it was more of a minor annoyance than anything.

With the UI APIs built, I ended up getting the core dialogs (main menu,
inventory) up and running pretty quickly:

<iframe width="400" height="280" src="https://www.youtube.com/embed/dloID-bSAVg" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Localisation

The fun thing about RPGs is there's a massive amount of text in them.
I thought that it was about time to handle this properly and stop
hardcoding everything.

I decided to go with a basic approach of having a mapping of integer
IDs to text as part of a string database. Each entry would have multiple
forms available, e.g. singular, plural, few, many, etc, as this would
allow for handling locales that have special pluralisation rules that
don't map to the ones in English.

Building this out was pretty easy. I also added a C# style string
interpolation syntax, e.g. `getTemplateString("Hello {0}", { "Rhys" })`
would expand to "Hello Rhys" to account for a lot of the dynamic
text used in battles.

If my requirements get any more complex, I'll probably switch to something
like libicu, but for now this is working well. I'm generally apprehensive
about adding large libraries / frameworks into the engine, as this
may cause issues with portability between OSes. It also massively slows
down the build process, and makes onboarding new developers harder, so
the simpler the build requirements for the game the better in my
opinion.

Alongside this work I added an item database that contained string IDs
for the title and description, and metadata for things like if an
item is usable, equippable, tradeable, etc. After this, I integrated
all of this into the Lua UI APIs to get the game's UI fully localised:

<iframe width="400" height="280" src="https://www.youtube.com/embed/rdVE_5xBDoE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Text Rendering - Part 2

Now that a lot more text is displaying in-game, I thought it was the
right time to revisit text rendering.

In a previous post I mentioned that the approach I took was incredibly
inefficient, but that I wanted to get something working for the
time being rather than spending a bunch of extra time on it.

With my old solution, I was iterating through each unicode codepoint
of each string I wanted to display, and rendering a quad for that
character. This meant if you had 10 strings of 500 characters being
drawn on-screen, that's potentially 5000 loop cycles _every frame_.

The solution I decided to go with to mitigate this was to build a
vertex array containing vertices for each character in the string,
which could then be cached on the GPU as part of a `Text` struct.
That way, I only need to loop through each string once, and after
that it'll just make a single draw call to redraw the string
on-screen.

I made use of a hot and cold cache for strings within the renderer.
Each time a string is drawn it's added to the hot cache, and at the
end of each frame all cold entries are removed, and the hot entries
are moved to the cold cache. This guarantees that strings aren't
regenerated on each frame, and strings that are no longer needed
are cleaned up.

In the future I may tweak this behaviour to add a decay factor, so
that if the user is flitting between menus fairly quickly, further
mitigation can be applied to regenerating strings, since it's fairly
expensive to perform operations on unicode strings.

### Retrospective

This week was another mostly-technical week, but a lot of what I've
done has primed the engine to be ready for integrating the gameplay
logic.

Next week I aim to start building out support for using items, and
having the server trigger effects and update player state in response
to that behaviour. This will get the client and server both ready to
do more complex interactions within battles, which is the ultimate
goal of this development cycle.

Til next time!
