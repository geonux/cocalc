import {
  TestEditor,
  describe,
  before,
  after,
  it,
  expect
} from "../../generic/test/util";

describe("CodeEditor - frame splitting tests", function() {
  this.timeout(5000);
  let editor;

  before(async function() {
    editor = new TestEditor("txt");
    await editor.wait_until_loaded();
  });

  after(function() {
    editor.delete();
  });

  describe("split frame in various ways", function() {
    it("verifies that there is only one frame", function() {
      let frame_tree = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();
      expect(frame_tree.type).to.equal("cm");
      expect(frame_tree.first).to.not.exist;
      expect(frame_tree.second).to.not.exist;
      expect(frame_tree.id).to.exist;
    });

    it("splits in the row direction (so draws a horizontal split line) with default options", function() {
      editor.actions.split_frame("row");
      let frame_tree = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();
      expect(frame_tree.type).to.equal("node");
      expect(frame_tree.direction).to.equal("row");
      expect(frame_tree.first.type).to.equal("cm");
      expect(frame_tree.second.type).to.equal("cm");
    });

    it("resets to default state", function() {
      editor.actions.reset_frame_tree();
      let frame_tree = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();
      expect(frame_tree.type).to.equal("cm");
      expect(frame_tree.first).to.not.exist;
      expect(frame_tree.second).to.not.exist;
    });

    it("splits in the col direction", function() {
      editor.actions.split_frame("col");
      let frame_tree = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();
      expect(frame_tree.type).to.equal("node");
      expect(frame_tree.direction).to.equal("col");
    });

    it("splits first leaf, now in the row direction", function() {
      const id = editor.store.getIn([
        "local_view_state",
        "frame_tree",
        "first",
        "id"
      ]);
      editor.actions.split_frame("row", id);
      let frame_tree = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();
      expect(frame_tree.first.direction).to.equal("row");
      expect(frame_tree.first.first.type).to.equal("cm");
      expect(frame_tree.first.second.type).to.equal("cm");
    });

    // continuing the test from above (with a nontrivial frame tree with 3 leafs...)
    it("tests set_active_id", async function() {
      const tree = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();

      // We list all the leaf id's...
      const leaf_ids = [
        tree.first.first.id,
        tree.first.second.id,
        tree.second.id
      ];
      // Then set each in turn to be the active_id.
      for (let id of leaf_ids) {
        await editor.actions.set_active_id(id);
        expect(editor.store.getIn(["local_view_state", "active_id"])).to.equal(
          id
        );
      }
      // Try setting a non-existing id.
      try {
        editor.actions.set_active_id("cocalc");
        expect("should raise").to.equal("exception but did not!");
      } catch (err) {
        expect(err.toString()).to.equal(
          'Error: set_active_id - no leaf with id "cocalc"'
        );
      }
      // Above should not change what was active.
      expect(editor.store.getIn(["local_view_state", "active_id"])).to.equal(
        leaf_ids[2]
      );

      // Try setting a non-leaf id -- this should also fail.
      try {
        editor.actions.set_active_id(tree.id);
        expect("should raise").to.equal("exception but did not!");
      } catch (err) {
        expect(err.toString()).to.equal(
          `Error: set_active_id - no leaf with id "${tree.id}"`
        );
      }
    });

    it("tests close_frame", function() {
      // from the above test, there are now 3 leafs.  The first has two leafs, and the second has one.
      // Let's close the second leaf.
      const tree = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();
      editor.actions.close_frame(tree.second.id);
      // Now there should be a single root node with exactly two leafs.
      const tree2 = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();
      expect(tree2.first.id).to.equal(tree.first.first.id);
      expect(tree2.second.id).to.equal(tree.first.second.id);
      // Next, close another frame.
      editor.actions.close_frame(tree2.first.id);
      // And now there is just the one root node as a leaf.
      const tree3 = editor.store
        .getIn(["local_view_state", "frame_tree"])
        .toJS();
      expect(tree3.id).to.equal(tree.first.second.id);
    });

    describe("tests that closing frames makes the correct frame active -- two splits", function() {
      let t: any;
      it("splits twice so that there are three frames total (looks like a 'T')", function() {
        editor.actions.split_frame("row");
        t = editor.store.getIn(["local_view_state", "frame_tree"]).toJS();
        editor.actions.split_frame("col", t.second.id);
        t = editor.store.getIn(["local_view_state", "frame_tree"]).toJS();
      });
      it("makes bottom left active", () =>
        editor.actions.set_active_id(t.second.first.id));
      it("closes bottom right frame", () =>
        editor.actions.close_frame(t.second.second.id));
      it("checks that bottom right left is still active", () =>
        expect(editor.store.getIn(["local_view_state", "active_id"])).to.equal(
          t.second.first.id
        ));
      it("splits again", () =>
        editor.actions.split_frame("col", t.second.first.id));
      it("makes the bottom right active", () => {
        t = editor.store.getIn(["local_view_state", "frame_tree"]).toJS();
        editor.actions.set_active_id(t.second.second.id);
      });
      it("closes the bottom right frame", () =>
        editor.actions.close_frame(t.second.second.id));
      it("checks that the previous active frame becomes active", () =>
        expect(editor.store.getIn(["local_view_state", "active_id"])).to.equal(
          t.second.first.id
        ));
    });

    describe("tests that spitting frames makes the newly created frame active", function() {
      it("resets the frame", () => editor.actions.reset_frame_tree());
      it("splits the frame along a row", () =>
        editor.actions.split_frame("row"));
      it("verifies that the new bottom frame is active (not the top)", function() {
        let t = editor.store.getIn(["local_view_state", "frame_tree"]).toJS();
        expect(editor.store.getIn(["local_view_state", "active_id"])).to.equal(
          t.second.id
        );
      });
    });

    it("tests close_frame by simultating a click on the close button", function() {});

    it("tests set_frame_full", function() {});

    it("tests set_frame_tree_leafs", function() {});

    it("tests set_frame_type", function() {});
  });
});