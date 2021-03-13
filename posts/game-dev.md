<!--{"date":"2019-05-09T19:19:04.723Z","title":"Game Dev"}-->

A few days ago me and a friend came up with a great game idea, so I thought
it would be fun to take a stab at it and finally get around to learning
modern OpenGL properly.

The biggest hurdles for me were the matrix maths that go into setting up
the camera, and wrangling with shaders.

The former I unfortunately still don't understand that well, but I've
managed to cobble something together to get a basic ortho projection
working.

The latter I had a nice breakthrough on today, and I'm now fairly
comfortable writing my own shaders and tweaking things to get the results
I want.

This'll probably end up being a post of many parts. With any project I
like to catalog my progress as I go so I can take a step back and see how
far I've come.

The following is a few screenshots showing my progress so far. I think a
verbiage that best sums this up is "slow and steady wins the race".

### OpenGL 101: Rendering a square

![A screenshot displaying a single orange square on the screen](/images/blog/game-dev-1-quad.png)

First off for me was just getting something, _anything_ displaying on
the screen. I started off with a square - internally made up of two stacked
triangles which appears to be the standard technique.

Fortunately I'd followed some
[excellent tutorials](https://learnopengl.com/) on OpenGL basics
previously, so this ended up being a case of reusing some old working code
and refreshing/relearning a bit.

There's a surprising amount that goes into getting this working with
OpenGL 3.0, as it expects you to do a lot yourself, but it was definitely
beneficial in the end as I understand the rendering pipeline a lot better
now.

### Moving further along: Rendering a sprite

I spent a fair bit of my second day refactoring things and adding in
stuff like input management, configuration, and making sure it ran
properly on each OS. Windows was especially frustrating, but that's
usually the case with any kind of native development.

Back onto the graphics side I spent some time on my second and third day
getting sprite support in. This involved dealing with texture loading,
adding in actors, managing their state on the logic worker thread, and
actually rendering their textures on-screen.

Behold my horrifying programmer art:

![Screenshot showing a single square on-screen that demonstrates my incredible lack of artistic talent](/images/blog/game-dev-2-sprite.png)

One of the nice things I did with this is binding the sprite
shown above with player input under a 'Player' actor. It's fairly
rudimentary, but I cracked a smile nonetheless at my terrible drawing
moving around the screen!

### Getting closer: Rendering spritesheets

You'd be hard pressed to find a 2D game without some form of
spritesheets / sprite batches. I was dreading this one a bit as the maths
for converting between X/Y coordinates on the images themselves and the
texture coordinates used in the fragment shader eluded me.

It all got much simpler (I had my eureka! moment) when I read this
[excellent answer](https://answers.unity.com/questions/1001787/how-should-i-convert-vector2-coordinates-to-uv-coo.html) to the problem. I realised
that texture coordinates are basically just _percentages_, so it
just became a matter of calculating the coordinate as a percentage
of the overall texture width and height, which I've done many times before
when coding manual layouts for iOS apps.

With this realisation I whipped up my first vertex shader from scratch
that would take in the texture's dimensions and the bounding box for a
particular frame within my spritesheet, and boom!

![Screenshot showing a more zoomed in version of terrible programmer art](/images/blog/game-dev-3-spritesheet.png)

I was really happy with this result. I'm no longer scared of shaders now
that I've attempted to write my own, and now my rendering code can handle
a lot of the stuff I need to throw at it for the game.

### Retrospective

A lot of people say don't write an engine, write a game. I think they're
absolutely correct too that you don't need to write an engine to build a
game. For me though, writing the engine is improving my fundamental
understanding of how game engines work, and that's enabling me to make
better decisions as I go.

This isn't going to be the next Unity, or even the next LÖVE, but I
reckon I'll still be able to achieve a lot even though it's being built
from scratch.

Til next time!
