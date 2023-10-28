import { type mastodon } from "../../../src";
import { waitForCondition } from "../../../test-utils/wait-for-condition";

describe("timeline", () => {
  it("can iterate over timeline", async () => {
    await using client = await sessions.acquire();
    let statuses: mastodon.v1.Status[] | undefined;
    for await (const entry of client.rest.v1.timelines.public.list()) {
      statuses = entry;
      break;
    }
    expect(statuses).not.toBeUndefined();
  });

  it("returns home", async () => {
    await using client = await sessions.acquire();
    const status = await client.rest.v1.statuses.create({
      status: "own post",
    });

    let statuses: mastodon.v1.Status[] | undefined;

    await waitForCondition(async () => {
      statuses = await client.rest.v1.timelines.home.list();
      return statuses.some((s) => s.id === status.id);
    });

    expect(statuses).toContainId(status.id);
  });

  it("returns public", async () => {
    await using alice = await sessions.acquire();
    await using bob = await sessions.acquire();

    const status = await bob.rest.v1.statuses.create({
      status: "public post",
    });
    const statuses = await alice.rest.v1.timelines.public.list();
    expect(statuses).toContainId(status.id);
  });

  it("returns hashtag", async () => {
    await using client = await sessions.acquire();
    const status = await client.rest.v1.statuses.create({
      status: "#mastodon",
    });
    const statuses = await client.rest.v1.timelines.tag
      .$select("mastodon")
      .list();
    expect(statuses).toContainId(status.id);
  });

  it("returns hashtag in camel case", async () => {
    await using client = await sessions.acquire();

    const status = await client.rest.v1.statuses.create({
      status: "#CamelCase",
    });
    const statuses = await client.rest.v1.timelines.tag
      .$select("CamelCase")
      .list();
    expect(statuses).toContainId(status.id);
  });

  it("returns list", async () => {
    await using client = await sessions.acquire();
    const list = await client.rest.v1.lists.create({ title: "List" });
    const statuses = await client.rest.v1.timelines.list
      .$select(list.id)
      .list();
    expect(statuses).toEqual([]);
  });

  test.todo("returns direct");
});
