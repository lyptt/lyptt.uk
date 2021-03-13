<!--{"date":"2019-05-16T14:41:07.632Z","title":"Game Dev - Part 2"}-->

Since my last post I've worked on a lot of the core systems necessary
to build my game. I've achieved quite a lot in a short amount of time,
it's been fun to see how the game world gets richer with each commit!

### Animations

I started off towards the end of last week with working on sprite
animations. I already had a basic representation of loading textured
sprites, however for animations I'd have to be able to display a portion
of a spritesheet ideally indexed per-frame.

This required a lot of fiddling with a custom shader to get the coordinates
to work just right, and I had to add in a few statistics to make sure
my animation updates were achieving the results I wanted.

![A screenshot showing the first animation frame](/images/blog/game-dev-4-animations.png)

Once I confirmed animation playback was working, I tied it into the
input system, and the results were very cool:

<div style='position:relative; padding-bottom:calc(420px);'><iframe src='https://gfycat.com/ifr/unconsciousflawedfalcon' frameborder='0' scrolling='no' width='500' height='400' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>

There was a ton of refactoring and reorganising of code that took place
during this process, but it was awesome seeing a little sprite walking
around the game screen.

### Tilemaps

The next step was getting tilemaps in place. This one took me a long time
to achieve, and I'm still not 100% happy with the implementation.

Tilemaps are an essential part of 2D games as they let you build large
game areas from a small set of assets. Initially I got them working
fairly quickly by building off of the shaders I'd previously built for
sprites, however I wanted to cull the tiles out that aren't being
displayed in order to reduce the amount of draw calls I was making.

Unfortunately I never got the maths quite right, resulting in the tiles
shifting as the camera scrolled around the screen. After spending a few
days on it I decided to leave it on the backburner until later on, and
only if I'm running into performance issues. Since the current target
platform is PCs, it's likely that it'll be a while before I run into
any real issues.

With problems like this, I usually end up relentlessly attacking it
until I figure it out, so I've kept it on a branch so I can revisit it
later when the rest of the game's development is further along.

With tilemaps implemented, the game started to look a lot more
fleshed out:

![A screenshot showing a basic 2D world](/images/blog/game-dev-5-maps.png)

### Collision detection

No 2D game is complete without some form of collision detection. There's
usually two ways to achieve it - frame-based collision or per-pixel
collision. In the name of simplicity I opted for the former, since I
don't really need the added precision that per-pixel collision gives you.

This required a bit of additional data to be loaded for each actor in
order to give the updater all of the collision rects for the actors
on-screen, and also the zone itself needed its own collision rects so
you can't just run off the edge of the map.

<div style='position:relative; padding-bottom:calc(420px);'><iframe src='https://gfycat.com/ifr/dimsandyfox' frameborder='0' scrolling='no' width='500' height='400' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>

You may notice the video's a bit jerky on playback. I've noticed that
when screen recording with Quicktime Player it bumps up the frame rate
of the game (and probably everything else too) by 10-15 FPS, and as I
haven't implemented game state interpolation, the renderer ends up being
slightly out of step with the updater.

Interestingly this is a common thing in games, as the render loop and
the update loop are running at different speeds (the updater in my case
is always 60 FPS), there's a chance that you won't get any new data
for a given render frame, resulting in the stuttery movement.

There's a [great article](http://www.kinematicsoup.com/news/2016/8/9/rrypp5tkubynjwxhxjzd42s3o034o8) covering this in more detail. It's an interesting
read!

### Networking

I spent a day or two taking a hard break from developing the game as I
felt massively burnt out after the horror that was tilemaps. After coming
back I was left with two paths to take, either I:

1. Start implementing the UI and battle system for the client
2. Start integrating a basic zone server for the game

I ended up going with option 2, because otherwise I'd be hardcoding a
lot of logic for the battle system due to the missing networking
components.

My game is pretty much always online. It's intended that you'd be playing
in a world with 500+ players online at any one moment, so just working
on the client at that stage felt like it would come back to bite me later.

The first thing I looked at was the zone server, as this would be what
the game talks to when first logging in, in order to find out what
zone the player was last in, their last position, their inventory, etc.

I made the decision to write it in C++ like the game client, mainly so
that I could share all of the model classes between applications and
keep things consistent. Surprisingly this wasn't as painful as I thought
it'd be as there's some great options available for writing services in
C++.

For the transmission mechanism I went for UDP as there'd be a lot of
updates for player positions, etc that would need to be sent to the client
very quickly. I didn't really want to implement all of this myself
however, so I went with [ENet](http://enet.bespin.org/) which seems
to have a lot of praise from the game dev community. It handles all
of the packet transmission side of things, guarantees ordered packet
delivery and has options for reliable transmission over UDP for
packets that you can't afford to be dropped.

There are a few things that aren't so ideal about the library, for
example pulling data out involves working with a raw `void*` buffer,
and you have to be careful with managing references to its objects
as they appear to be reused internally. It definitely achieved a fair
bit on its own however as I had a basic connection up and running
really quickly.

The rest of the zone server work I did over yesterday and today
involved setting up the database tables, designing a basic message flow
for the initial connection process, and implementing that flow on
both the client and server.

The results are very cool though. I can tweak my position and zone
information in a DB table and as soon as the game boots up I'm
in the new position!

There was a bit of refactoring required client-side in order to handle
being in a loading state instead of always being in a zone. This definitely
hammered home that if I'd hardcoded all the network state, a lot of the
engine's design may end up have being incompatible once I introduced
the networking component.

It's less interesting seeing screenshots of consoles, but I'm excited
by it nonetheless:

![A screenshot showing a networked 2D world](/images/blog/game-dev-6-network.png)

### Retrospective

Over the past week the game engine's seen a substantial improvement.
The architecture's a lot better, and with the majority of the rendering
work now finished, I can finally start working on the actual gameplay
elements. I'm very close now to having a networked multiplayer session,
which is really exciting!

I was pleasantly surprised by how easy it was to get C++ web services
up and running. Originally I assumed I'd have to write them in C#
due to library quality, etc, but so far it all seems to be working
really well.

I'm a bit bummed out over maps not being the way I want them, but I'm
keeping in mind that all I need to produce right now is an MVP. There'll
always be time later to touch things up once the game's in a demoable state.

Til next time!
