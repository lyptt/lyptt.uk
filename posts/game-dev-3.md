<!--{"date":"2019-05-24T23:51:28.302Z","title":"Game Dev - Part 3"}-->

For the past week I've made great strides in getting a lot of the essentials into the game engine.
At this point I'm finally ready to jump into the battle system and see the gameplay start to form
into something more concrete.

### Text Rendering

For RPGs of any kind, there's always going to be a lot of text to display. This was one of the
things I took some time to properly consider. The main decision was around having support for
Unicode. There's two schools of thought for this when building games. Either you:

- Don't support unicode at all, and either ignore other languages and use ASCII, or cobble
  together an encoding of your own based on your packed font textures
- Support unicode as early as possible, to prevent mass refactors trying to get it into the
  engine later

I couldn't see a _right_ way of doing it. There's a lot of bespoke solutions to supporting
text in games, but nothing definitive. Some people use Freetype and build font caches
dynamically at runtime, other people generate bitmapped font textures for each combination
of font size / font style they need, and others like [Valve](https://github.com/libgdx/libgdx/wiki/Distance-field-fonts)
go the extra mile and render fonts entirely with vertices on the GPU.

In previous unreleased games I've used the former two solutions. For this game, since it's
going to be a 2D game that's _designed_ to look like a GBA game, I wasn't too concerned
with having uber high resolution fonts that scale dynamically, and I felt it would feel
a bit jarring having very smooth fonts coupled with scaled up sprite art, so I opted
for the simplest of all the options - bitmap fonts.

My aim is to support multiple languages easily. Initially though, my target languages are
English and Japanese, so for my bitmapped fonts I've packed in all of the latin characters
necessary to render English, and all of the Hiragana, Katakana and common Kanji I'd
need. This could be massively reduced later by extrapolating all of the characters used
in the localised text files and building a font from those. This also appears to be
the strategy a lot of Chinese and Japanese games use in order to avoid packing in
30,000+ Kanji into a single texture.

It took a bit of time to figure out a decent way to render text. For now I've gone
with a basic but highly inefficient solution of rendering each UTF-8 codepoint's
glyph in a loop. I plan on going back later and instead generating vertices for
each glyph in a loop and caching it from then on in order to avoid slowing down
the render loop. The results are pretty cool nonetheless:

![A snippet from the game showing a test string rendering on top of the game world](/images/blog/game-dev-7-text.png)

### UI elements

As you may have noticed from the borrowed test art, I want the game to have a
very Earthbound-like feel to it. One of the things I love about the aesthetics of
this series is it uses a very simple art style to great effect, rather than other
games from the era like FF6 or Star Ocean that try to pack in a ton of detail
into a very small space.

One of the benefits of this art style is it has a very light hearted feel about
it, which can be used to great effect in the game when telling a dark and
gritty story, as witnessed in all of the Earthbound games. I love that combination,
and I definitely want to achieve similar results in my game.

With the UI side of things, keeping with the theme, I don't want it to be too
detailed, rather I want it to take a backseat most of the time except when
you actually need it. To this end I've pared down the UI widgets to the bare
minimum - bordered windows, labels, a focus underline that shows you where
your cursor is, and minimal use of icons where necessary.

Bordered windows are the only real special case as they involve some elements
stretching (or tiling) dynamically, whilst others remain fixed. I've done this
countless times when rendering on the CPU, but doing it on the GPU was all
new to me, as evidenced by my many crazy renders along the way:

![An image showing a fairly messed up bordered window](/images/blog/game-dev-8-bordered-windows.png)

After a while I had my eureka moment and managed to get the shader to play ball.
I had a realisation that I was basically working against the system which is why
nothing seemed to work quite right. What I was attempting to do in the shader
was map the appropriate portion of the texture depending on what vertex X & Y
values were coming in. The problem with that is the X and Y values _overlap_,
as shaders deal with _points_, not faces or triangles.

Once I realised this I tagged the coordinates I needed for a particular group
of vertices in the vertex array itself, as that way I'd have all the data
I needed without having to determine things on the shader. The results
speak for themselves:

![An image showing a normal looking bordered window](/images/blog/game-dev-8-bordered-windows-2.png)

This was a really critical point for me as now I understand exactly how
shaders work, and how to best utilise them in OpenGL, which will help me
a lot when dealing with more complex rendering scenarios.

As shown in the above screenshot I also got tinting working for the UI
fairly easily by applying a HSV adjustment inside the fragment shader. This
lets me achieve dynamic UI colours, which Earthbound and Mother 3 both
use to great effect. It's a nice touch of customisability in the game that
I'm eager to replicate.

### Map rendering take 2

With my newfound knowledge, I had a lot more confidence in my ability
to work with a lot of vertices in a single shader when rendering a chunk
of the game, rather than just using two triangles like everything else
has been done so far.

To this end, I really wanted to go back and revisit the map drawing
routines. When profiling in Visual Studio I noticed that 60% of the
render time was taken up by drawing the map by looping through the
full tileset and rendering quad by quad. It was horribly inefficient and
I couldn't see the game going live with map rendering in that state.

I spent a lot of time whilst getting text rendering to work on more
optimal ways to do it, and on Reddit one person mentioned building up
a list of vertices for the full string and caching it, to prevent looping
every frame. I thought that the same approach could work for maps too,
so I gave it a try. I was honestly shocked at how quick it was to get
working - within half an hour I'd adapted the vertex shader to get all
of the vertices in the right place, and as soon as that was done it
worked. Instantly.

It felt like night and day with my previous attempts, where before I
spent the best part of three days trying to get something reasonable
displaying on-screen. I think my mistake before was trying to replicate
what comes naturally to the GPU on the CPU. Before I was attempting to
cull each individual tile outside the viewport and only render visible
tiles, taking into account the camera being between tiles where you have
to add an extra tile of padding, etc. While I'm sure I could've eventually
got the maths right, it was still the wrong approach ultimately.

Now all I have to do is convert the tilemap into a vertex array, bind it,
and let the GPU figure out what to display and what not to display. On
the CPU side I can safely assume the full tilemap is rendered, which
makes positioning the map taking into account the camera position trivial,
and on the GPU side it happily crunches through all of the points in the
vertex shader, making use of additional attributes passed in via the
vertex array. Just like I'd done with the bordered windows.

There's no screenshot for this one since it's literally identical to
the last blog post's screenshot. This one was all about performance.
In terms of numbers - on my mid-2015 Macbook Pro the game used to use
30-35% CPU. Now it uses 10% CPU. That's a monumental drop in CPU usage,
which makes this absolutely worth it in the end.

With this huge win I plan to revisit the text rendering later and apply
a similar change in order to reap the same kind of performance benefits
that this has gained me with map rendering, but for now I definitely
want to move on to more gameplay-focused work to get something more
substantial.

### Game UI

One of the things I wanted to do for this engine was build a flexible
UI layer that could easily be tweaked to suit the needs of the game.
I really liked working with ImGui for the debug windows, and wanted a
similar experience for the normal UI present in-game.

I achieved this by building up a few POCOs holding the bare minimum
information for the UI - `Dialog` structs that hold information on
the frame, and its contents, and `Label`, `Line` and `Icon` structs
holding information on visual content present within a `Dialog`.

This all then gets thrown at the renderer which uses its own APIs to
render the low level elements like window borders, text and blocks
of colour. They're essentially a 1:1 mapping, which makes rendering
the UI trivial.

For the adaptibility side of things, I do plan on having Lua scripts
be in charge of UI management in its entirety so that the UI can
be treated as a resource in its own right, rather than being hardcoded
into the engine. This allows for scenarios like overriding certain
dialogs to operate differently on more bespoke platforms like consoles,
and it also speeds up the development cycle by allowing for tiny changes
to be tested without recompiling.

Wiring this all into the update loop was pretty straightforward. I'm
forgoing actually building any kind of settings screens, etc, for now
as I don't really need them yet, but I proved out the approach at least:

![An image showing a bare looking settings screen](/images/blog/game-dev-9-ui.png)

### Retrospective

There were a ton of performance fixes, bug fixes, networking enhancements
and other non-visible changes in the last week, and it definitely swayed
significantly in that direction, so it felt at times like things were
stagnating. This changed a lot towards the end of this week though, as
I managed to improve a ton of things on the UI side and crossed
another two features off of my list, which felt pretty good.

Over the course of the next week my aim is to start getting a decent chunk
of the gameplay logic into the game and zone server, and start playing around
with numbers and balancing to see if my game design holds up.

Til next time!
