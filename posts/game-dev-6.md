<!--{"date":"2019-06-16T12:47:53.666Z","title":"Game Dev - Part 6"}-->

This week was spent doing a ton of stuff to support using an item from your
inventory. Whilst this is a very basic gameplay mechanic, it's the first piece
of real gameplay being integrated, so a lot of setup was required to get things
architected properly.

### Automated testing

Before proceeding with this, I explored doing automated render tests for the
renderer. As future gameplay additions would require a lot of rendering
code, I thought it'd be a good idea to get this stable and have a bit of
code coverage.

Testing purely visual functionality is a bit strange, because it's not like
you can just assert that OpenGL methods are called, you need to verify that
they actually _look correct_ too! This ruled out doing some kind of stubbing
or basic "it called this method so it must be correct" style of testing.

Instead, I went with an approach I've used to great effect when doing automated
tests for CSS styles - screenshot testing. The basic idea behind screenshot
testing is you take a reference screenshot that demonstrates a correct visual
state, then when the test runs, you get your UI into the correct state, then
take a screenshot and diff the results.

The good thing about this is when the tests run it ensures pixel-perfect
accuracy. If there are slight differences, say for example I accidentally
swap red with blue when tinting a dialog box, it'll pick up on it and fail
the test. The only downside is the space taken up in the git repository for
the reference images. To mitigate this I made sure the outputs are very
simple blocks of colour so they compress easily when saved as PNGs.

The results are very cool, as the diffing library I used will actually
highlight the areas of the image that are incorrect, so you can see exactly
what is wrong with the output. Here's a demo of all the tests I have so far:

<iframe width="560" height="315" src="https://www.youtube.com/embed/8OtyF6PWwAM" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Using items

The first step in getting the inventory working was to get item management
in. This means being able to use an item, have the server acknowledge it,
and update the UI to indicate the change in quantity. This also has to handle
cases like removing an item from the inventory UI and shifting the following
items back one slot.

This was mostly boilerplate and a bit of networking, and minor updates to the
inventory UI Lua script to support shifting items around. Here's what it looks
like:

<iframe width="560" height="315" src="https://www.youtube.com/embed/OAzk4cgZMnw" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Actually using items

Of course the above changes don't really achieve a working inventory, because
nothing happens when you use an item. For that, I needed to get all of the
scripting working, along with adding support for a bunch of extra messages
between the client and server.

I spent a bit of time designing the logic flow between the client and server,
it looks roughly like this:

- Client -> Server: Use this item
- Server -> Execute item script
- [...] _various item events triggered_
- Server -> Client: You've used this item

A few essential item events were added to enable the kind of basic things
you'd expect to happen when triggering events, e.g. locking player movement,
displaying messages, etc. There was a lot of wiring up additional containers
for player state on the server, and a fair bit of boilerplate for handling
all of the extra messages sent between the client and the server.

Fortunately all of this stuff is reusable for other gameplay elements, which
should help save time later.

Here's what the inventory looks like with scripting implemented:

<iframe width="560" height="315" src="https://www.youtube.com/embed/CD950s_EW3E" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

This demonstrates tying together a bunch of the features I previously added,
including the UI / Dialog system, localised text, and client/server scripting.
It's very cool seeing it all be applied to something like this!

### Retrospective

This week a ton of focus was placed on a single feature, which is a bit
different to past weeks. I think this is mainly due to the fact that previous
weeks were spent implementing a lot of core essentials to the engine, whereas
this week was about using that functionality to build a gameplay feature, so
the work was longer but more focused.

Next week the plan is to start implementing parts of the battle system. This
will initially be focused on interacting with your ability deck, toggling
on/off the battle UI, and displaying health and balance meters. With this in
place, the engine will be set up nicely for participating in battles properly.

Til next time!
