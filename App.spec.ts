import { a, b } from "./src";

describe("dummy test", () => {
    // Just updated the file
    it("should pass", () => {
        expect(a + b).toBe(3);
    });

    it("should pass as well", () => {
        expect(a + b).toBe(4);
    });
});
