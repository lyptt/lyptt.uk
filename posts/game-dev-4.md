<!--{"date":"2019-06-02T21:07:01.131Z","title":"Game Dev - Part 4"}-->

The past week I've been doing a lot of the prep work for getting the battle system working. There were a few massive chances added to the engine in order to accommodate this.

### Implementing Metal

One of my concerns for the engine is supporting esoteric platforms that I can't use my current tech stack with. I'd absolutely love to have this on the Switch in the mid-long term if the game takes off, and on that platform you can't use OpenGL. Your only option on consoles is to use their bespoke rendering APIs to get the job done.

With this in mind, I decided to do a bit of a refactor to the rendering portion of the engine so that different renderers could be switched between via CMake flags, and additional renderer implementations could be added with minimal effort.

For my trial run I went with Metal. It's actually a fairly relevant choice as Apple's deprecated OpenGL, and the OpenGL offerings on the Mac are very poor anyway. I managed to get the refactor finished, and I got part of the way towards showing basic things on the screen which was a success. Unfortunately a lot of the more modern rendering APIs are very low level and it's hard to grok what's going wrong. Apple's done a great job in adding a ton of validation to its APIs, but I'm still hitting some stumbling blocks around my current usage of the API, so I've shelved this for now while I get the rest of the engine done.

### Scripting Enemy Walkpaths

In games like mine a ton of stuff is scripted out. Getting some kind of scripting support in was pretty much essential for any core gameplay mechanics, as it'd be used for all of the enemy AIs, the behaviour of items, NPC / quest interactions, and the UI.

I ended up going for the de-facto Lua option. Tons of games use Lua, and it's really easy to embed into an application. I started out with adding support for enemy idle scripts. These scripts would enable enemies to follow a predetermined series of actions when they're idle, i.e. not in-battle.

A bit of setting up was required in order to get the notion of enemies available in the client and server. Once this was done, it was simply a matter of adding a few scripting APIs for Lua to interact with the server and update an `Enemy` struct's state, and issue the appropriate message to players in-range.

The Lua bit was quite interesting. I had a couple of options in implementing it. The more traditional approach would be to have an equivelent of the function you have in a standard game loop, an update function with a delta time, and let the script figure out what to alter. Scripts in this fashion would look something like this:

```lua
local WALK_CYCLE_TICKS = ...
local state = {}
function update(delta) do
  if state.last_update + delta > WALK_CYCLE_TICKS then
    state.position.x = state.position.x + 2
  end
end
```

The other option was to have a higher level scripting interface, and let the C++ side figure out what to do. Scripts in this fashion would just be invoked and start from the top if they hit the bottom. They would look something like this:

```lua
move(164, 300)
sleep(2000)
move(100, 300)
sleep(2000)
loop()
```

I ended up going with the latter option, as then non-programmers could figure out how to write enemy AI scripts with relative ease. This is important for the content curation part of the development process as it takes a lot of the pressure off of me.

The second example is actually my real test enemy's script. I made use of Lua coroutines to yield after each scripting function is called, allowing me to suspend the Lua script until the command has finished. This lets the scripts be really expressive, and intuitive for those that aren't strictly familiar with how scripting / programming works.

Here's the walkcycle in action:

<div style='position:relative; padding-bottom:calc(420px);'><iframe src='https://gfycat.com/ifr/leadingassuredarachnid' frameborder='0' scrolling='no' width='500' height='400' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>

It's really cool to see the little guy wandering around the map, and now that I have the Lua scripting interface built, it can be easily extended to support items, abilities, and more!

### Pathfinding

In the spirit of getting enemies to behave well in the game environment, one of the essentials I had to build in was pathfinding. Algorithms have always been a bit of a pain for me. It takes a while for me to get my head around what they're doing, as they're often very terse and difficult to pick apart.

I sprung for the A\* pathfinding algorithm, as it's an industry standard and there's a ton of articles about how to implement it in your game. For me, I needed pathfinding mainly for enemies so they can do things like walk to an arbitrary point around obstacles, or chase the player around the map when they've built up hate.

This took a bit of time to get right. A lot of articles assume only four directions, whereas I have eight. This leads to strange results with the generated path going off in an unexpected direction instead of what seems more sensible. I eventually got it working which lead me to the nice video above. One of the things that really helped a lot was going for a TDD approach with the pathfinder.

I set up all the initial data structures and stubbed function calls, and built out tests that asserted a ton of strange and wonderful scenarios to make sure the algorithm didn't break, such as you already being at your destination coordinates, having an impossible to access path (e.g. if collision boxes are blocking off the whole area), or having a path that goes off the edge of the map.

I managed to find a ton of bugs this way, and also a few regressions as I fixed everything up. It definitely would've taken longer if I hadn't done this, as manually testing the walkpaths would require having to launch the server and client for each test.

One of the remaining things that's a little janky is that the pathfinding algorithm works in tile coordinates, as doing it per-pixel would be far too expensive. Because of this, if you're not at the top left point of a tile, the entity will end up walking to the top edge of the tile, then jumping down at the end of the path. It's an easy fix, but I've kept this one on the backburner as it's fairly minor.

### Entity interpolation

I noticed a few issues after getting all of this working. Firstly, I was getting heavy bottlenecking when the enemy was updating. This was due to the fact that every pixel change to the enemy's position was being communicated to the client. Also, vice versa for the players. I decided to make a good effort to rectify this architectural issue by limiting the verbosity of the updates from either side.

This definitely fixed the speed issue, but now there's another issue - everything's very stuttery. I had to do a bit of reading on networked game architecture to figure out a nice way of rectifying this. The answer is basically entity interpolation. I read an [excellent article](https://www.gabrielgambetta.com/client-server-game-architecture.html) on how this works in practice.

I already had issues with stuttery movement before adding enemies. I chalked this up initially to not doing interpolation on the render thread between game state changes. Adding interpolation at this level however didn't help at all, it was still stuttering almost as much as before. It was clear I needed to fix the architecture of the communication between the client and server.

I decided to change things up by not immediately using an updated actor's position from the server. Instead, I keep a record of it as its canonical position, and do a linear interpolation between the actor's current position, and their canonical position. This worked really well, and other than the odd bit of lag that you inevitably get, everything moves around the screen with no sudden juddery movement. One of the hacky things I've done for now is hardcode the animation rate for the interpolation. This wouldn't work if there were variable inconsistencies between local actor positions and remote actor positions, as you wouldn't be able to catch up in a reasonable amount of time.

My solution for this is to have a variable animation rate, based on how different the two positions are. That way, if you for example have a massive lag spike and the actor's moved halfway off the screen in the time it's taken for you to receive packets again, it'll zoom across the screen rather than slowly crawl and be permanently behind. You'll observe this sort of behaviour in most online games, if you have a lag spike things will appear to speed up temporarily to compensate.

This work brought on a big realisation for me that in online games you're not really seeing things in real time at all, even though it _appears_ to be real time. Everything other than your own player is in the past, and the game's doing its best to make things seem as up to date as possible so that the illusion isn't broken. It's a clever technique to avoid overloading the client or the server, and it's given me a lot of insight into how to proceed with the networking architecture going forward.

### Retrospective

This was another technical week for the most part. All of the work was essential though in ensuring that the game can one day be shippable. Next up is getting abilities working in-game, so stay tuned for that!
