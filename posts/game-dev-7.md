<!--{"date":"2019-06-30T07:50:25.231Z","title":"Game Dev - Part 7"}-->

For the past couple of weeks there's been a ton of changes to the core engine
to make things more maintainable and improve the speed of the more critical
regions of the code. It's taken a lot longer than I thought it would, but
it's much easier now to work on the game than before.

### The refactor from hell

One of the things that seems quite common in game development is that the
architecture of a game becomes more spaghetti-like as you get further in.
Turning a prototype into a real game is challenging, as the internal systems
within a game are constantly changing right up until it's released.

The same issue was prevalant in my engine. The question I kept asking was where
is this piece of functionality in the code? I knew it was time to take a step
back and rethink the architecture of the system so that I could make it easier
and faster to extend and improve.

There were a few key issues I wanted to resolve with this work:

- Eliminate any use of global variables like screen dimensions, worker queues,
  etc
- Make use of IoC to allow game systems to be swapped out with test versions,
  and to reuse systems along with others that are unique to a game mode
- Rethink the entire loading pipeline as loading code was spread across many
  core systems
- Improve the performance of sprite reconciliation in the render pipeline, as
  it was the main bottleneck in the engine

I managed to get through all of these, but it took a lot of time and effort.
I didn't apply the refactor to the scripting or networking systems, as by the
end I could see myself spending another week just on those. The core systems
however are all much better as a result and these are the elements that will
get the most tweaks and updates.

One of the things I like is now the logic and render systems are very easy
to interpret. The order of tasks is immediately obvious, as are the
dependencies between systems and subsystems:

```cpp
State DefaultUpdater::update(std::vector<InputEvent> events) {
  load_system.run(state, load_zone_system, load_actor_system);
  scheduled_update_system.run(state, state.scheduled_updates);
  input_system.run(events, state, player_input_system, ui_input_system, collision_system);
  animation_system.run(state);
  network_system.run(state, load_zone_system, load_actor_system);
  event_system.run(state);

  return state.buildState();
}

void OpenGLRenderer::render(const State& state) {
  if (render_state.load_state.loading_essential_resources) {
    render_state.screen_width = getScreenWidth();
    render_state.screen_height = getScreenHeight();
    essential_resources_gl_system.run(render_state, load_font_system);
    return;
  }

  load_system.run(state, render_state, load_map_system, load_sprite_system);

  // If we're still loading required resources (maps, dialog resources, etc), don't render anything yet
  if (render_state.load_state.loading_required_resources) {
    return;
  }

  auto plan = render_plan_system.run(render_state);
  render_system.run(render_state, plan);
}
```

Before the above changes, you'd be trawling through a lot of code to see
where the internal state was being mutated for the particular functionality
you were trying to change, however with the above changes it's incredibly
easy to jump directly to the system you need to work with.

One of the key things I did with this refactor is make use of polymorphism
to eliminate any kind of tight coupling between rendering, logic and windowing
systems.

Factories now provide a suitable class for each system along with
an adapter class that _does_ know about each implementation and can bind
them together. This means you can easily swap out backends (e.g. SDL),
renderers (e.g. OpenGL) and updaters (logic systems) and have any combination
interoperating with one another.

One example of the above having a huge benefit is for example porting this
game to a console platform. On consoles you have a ton of bespoke APIs to
set up services like input, io, etc, so you could now write a dedicated
backend class for that platform, an adapter that links it to your renderer
of choice and it would work without further alteration.

I also explored setting up extra linting tools like cppcheck. This ended up
unearthing a few bugs (mostly with uninitialised variables) that would've been
annoying to hunt down manually.

### Metal Part 2

In a previous post I mentioned experimenting with Metal. The impetus behind
this was to get comfortable with modern low level rendering APIs, as most
consoles use these, and this appears to be the future of rendering so it'd be
likely that I'd encounter these APIs a lot in the future.

With the refactor out of the way, it was now much easier to swap out rendering
implementations for others, so I thought it'd be a good chance to see if I
could finally get comfortable with the Metal API.

There were a lot of stumbling blocks along the way, Metal's documentation is
fine, but unfortunately key information is completely missing from the docs
which made setting up the render pipeline difficult. What's worse is that
no-one appears to post much about Metal online, so web searches gave no
results for the kind of issues I was seeing.

Fortunately though I managed to figure it all out, and got a full Metal
implementation working with my engine. It's very basic at the moment, as
it's all synchronous, and Metal's a thread safe API that's designed for you
to build a ton of render commands onto worker threads, then join them back
up at the end and send it to the GPU.

Even with this in mind though, I'm still seeing noticable improvements to
the engine in Metal mode. The main thing is reduced frame stutter. There's
barely any in the game right now but you still get the odd bit every now
and then (lots more optimisations to do I think!), but with Metal this is
significantly reduced.

The one key benefit of Metal is it has [incredible debugging tools](/images/blog/game-dev-10-metal.png).
This helped me out a ton, as I was able to see the exact data being sent to
the GPU, how the shaders interpreted it line by line, the geometry that was
being rendered, etc. OpenGL by contrast is incredibly difficult to debug,
so this was a very nice change, and should make integrating new rendering
features a lot easier.

### Retrospective

It's been a challenging couple of weeks, I think this was a turning point for
the engine from being a toy project to being something capable of eventually
being released. Next week I aim to get some battle UI working, and start
playing around with the initial client <-> server message flow for battles.
