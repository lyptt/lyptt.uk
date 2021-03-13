<!--{"date":"2019-07-27T20:11:12.332Z","title":"Game Dev - Part 8"}-->

It's been a long month of no updates, and unfortunately the battle system is still in very early stages as it's not yet fully designed. On the bright side though, there's been an absolutely massive list of changes to run through!

### Lua, C++ and all that jazz

The scripting system is one of the elements of both the client and the server that I'm perpetually unhappy with. I summed up my experiences with this in a recent reddit comment:

> Initially I used Lua with the 'internal state hidden' approach where you'd query scripting APIs that would in turn interact with the game state objects for you. I really wasn't happy with how incredibly unsafe Lua was. There's no documentation on which VM calls clear the stack and which you have to clean up manually, which lead to a ton of debugging and headaches as I was building it out. The fact that such an essential part of the system was dependent on something like this made me deeply concerned.
>
> Next I tried a C++ wrapper for Lua. Whilst this alleviated the concerns somewhat, the extra overhead of the wrapper irked me a bit too. I wanted to keep things as lean as possible both on the build system side (e.g. no binding generators) and at runtime.
>
> I then went with the idea of making everything C++ but compiling the scripts as DLLs that the engine would pick up at runtime. This worked fine and was the variant of externalised scripting I was most happy with. I used the same approach with Lua by hiding away game state and providing API classes that the libraries could interact with.
>
> Very recently though I've been on a mission to strip out a lot of the complexity of the class structure, e.g. removing virtuals / inheritance and moving to templates and composition where possible. I still wasn't 100% happy with the plugin approach as now I had a ton of extra build targets to keep up with whenever I changed the core libraries, so I decided to internalise everything into the core libraries and not have any scripts loaded dynamically at runtime.
>
> I'm still not happy, but I'm the happiest with it that I've been so far. UI/events are difficult to get right in a way that's simple for script authors to work with, and also efficient at runtime. The current approach leverages compile-time polymorphism, allowing the compiler to heavily optimise each script. It also allows the scripts to be easily testable by substituting the default API classes with mocks, which is nice.
>
> One huge benefit to having the scripts be written in C++ is that no data needs to be marshalled between the core engine and the scripting system, as the scripts can leverage the same types directly. This is something I really like, as depending on the complexity of the data being passed into the scripting system there could be a lot of overhead.

As you may observe the scripting system went through a monumental series of refactors and rewrites to get to the state it's in now. Like I mentioned, each script is now just a basic C++ class that runs line by line, doing the same thing the Lua scripts do but natively rather than through an interpreter.

I wasn't able to remove all of the virtual call overhead without introducing maintenance issues, but for the most part the new scripting architecture works well. As an example, this is what a real item script now looks like:

```cpp
#include "script_item_secret_note.h"
#include <logic/default/plugin/default_plugin_event_api.h>

ScriptResult ScriptItemSecretNote::resume(DefaultPluginCoreApi &core,
                                          DefaultPluginUIApi &ui,
                                          DefaultPluginEventApi &event) {
  if (!displayed_message_1) {
    displayed_message_1 = true;
    return event.message(12);
  }

  return ScriptResult::NONE;
}
```

It's pretty easy to follow, it's basically a tiny state machine (e.g. you'd have a bunch more flags like the `displayed_message_1` flag to allow it to follow along linearly). I think this strikes the right balance between performance and maintainability, and it's the solution I've been the most happy with.

### The refactor from hell, or how I spent 2 weeks regretting every decision I've made

In a previous post I mentioned refactoring various elements of the game engine to remove complexity and make things more maintainable. I had a bright idea to take this a step further and swap out a lot of the OOP-wrappers (virtuals, factories, etc) with Templates. This would allow the C++ compiler to heavily optimise the engine, strip out much more dead code, and perform better with the CPU's caching behaviour.

It turns out that this is simple on paper, but a ton of work in practice. My engine has enough features now that fundamentally changing its architecture is incredibly time-consuming.

The idea behind this change is fairly simple. Instead of something like this:

```cpp
class Service {
public:
  virtual ~Service() = default;
  virtual void doSomething() = 0;
};

class ServiceImpl: public Service {
public:
  void doSomething() override {
    // TODO: Do something interesting
  }
};

class App {
public:
  App(std::unique_ptr<Service> service) : service(std::move(service)) {}
  void doAllTheThings() {
    service->doSomething();
  }
private:
  std::unique_ptr<Service> service;
};

App app(std::make_unique<ServiceImpl>());
app.doAllTheThings();
```

You'd do something like this:

```cpp
class ServiceImpl {
public:
  void doSomething() {
    // TODO: Do something interesting
  }
};

template <class S>
class App {
public:
  void doAllTheThings() {
    service.doSomething();
  }
private:
  S service;
}

App<ServiceImpl> app;
app.doAllTheThings();
```

It's a similar principle to C#'s generics, but everything's determined at compile time, and this is forced - you don't get reflection in C++, which means you'll have difficulties implementing a lot of the fancy patterns you'll see in higher level languages. The good thing about this approach though is the template type slots are basically 'filled in' when the templates are instantiated (e.g. when you create an instance of `App`). Templates are like macros on steroids, and are incredibly powerful without sacrificing any runtime performance.

You may observe though that the two approaches are _very_ different syntax-wise. This caused a lot of headaches by itself, but it wasn't the only issue - templates tend to be infectious, which meant a lot of rewiring of the consumers to also support templates.

Fundamentally though the refactor went well. The new architecture should lend very well to platforms with limited CPU capacity, which is important when making games.

### Rewrites are sometimes a good idea

Whilst the game client's gotten a lot of love over the past month to make it faster and more maintainable, the server was languishing. It had the same architectural problems that the client had. The saving grace was that it was a much simpler codebase, so that softened the blow somewhat.

I decided to investigate how much effort it would take to port the server codebase to C#. Having the server written in C# has a few distinct benefits - C# is very easy to write, it has incredibly powerful parallelism APIs out of the box, and fundamentally there's just way more well-maintained libraries available for C# applications than there are for C++.

As an example, here's the things I can get for free or nearly free in C# that I'd have to spend multiple weeks building out myself in C++:

- Distributed task-based processing for parallel collision detection, script evaluation and data processing (important for performance with a lot of entities on a single map)
- Web API support enabling admin APIs and a dashboard interface to be available for sysadmins
- Distributed logging and monitoring

On top of that, there's a bunch of things that are painful in C++ and trivial in C#:

- Dependency injection
- Database querying / updating
- Binary serialisation

I'd solved a couple of the above items in C++, but the weight of the others was bearing down on me as time went on, so it felt like the right time to give it a try.

This turned out to be incredibly simple, partly because I'm way more confident in C# than C++, and partly because I was getting so much core functionality for free. It took about 4 evenings to finish the rewrite and achieve feature parity with the existing server, with noticably less code which is always a plus.

### Getting more organised, slowly

The final thing I tackled during the past month was to stop relying on my aging brain to remember every single thing left to do for a viable demo. Now that GitHub provides unlimited private repositories, I decided to move the game repository off of my personal git server and onto GitHub, where I could take advantage of its new project features.

![A screenshot showing the project breakdown](/images/blog/game-dev-10-planning.png)

I've now added all the tasks necessary to get to a demoable stage, with a few stretch goals to work on during the Kickstarter campaign (console port?). This is really great as now I can just work through the backlog bit by bit, which is a lot less overwhelming, and it makes tracking my progress a lot easier.

I also played around with Azure DevOps to do automated CI builds. If this was an open source project I would normally use CircleCI or Travis, but it costs a lot of money using those services for private repositories, and you need a combination to do Windows _and_ macOS builds. Azure DevOps supports building on all platforms, which means every commit to master will now result in a new release build of the game being produced and archived for play testing, which is incredibly useful. Finally I can stop sending Visual C++ debug DLLs to my testers just so they can run a copy of the game!

This also can help a lot with ensuring that the game actually _builds_ on each platform. Each compiler has its own quirks (mainly Visual C++ being more bitchy than the others), which means that even if you write portable C++ code, it's very likely that you'll be missing a header on one platform, or you'll be using an unimplemented C++17 API on another, (again, this is usually Windows).

### Retrospective

I won't lie, the past month has been difficult. There's been a huge number of very internal changes that made the game more and more broken over time, and it felt for a while that it'd be a whole extra month just to get things in working order again. Fortunately I came out the other side with a much better codebase that's a lot closer to being production-ready. With the battle system designs nearing completion, work on that side of things is soon to begin. Stay tuned!
