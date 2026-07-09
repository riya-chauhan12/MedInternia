import { isAllowedUpload } from "../uploadValidation";

// Regression coverage for issue #409: the upload filter previously accepted
// any mimetype starting with "image/", which let image/svg+xml through and
// enabled stored XSS via a <script> tag embedded in an uploaded SVG.

describe("isAllowedUpload", () => {
    it.each([
        ["photo.jpg", "image/jpeg"],
        ["photo.jpeg", "image/jpeg"],
        ["photo.png", "image/png"],
        ["photo.webp", "image/webp"],
        ["photo.gif", "image/gif"],
    ])("allows %s (%s)", (name, mimetype) => {
        expect(isAllowedUpload(name, mimetype)).toBe(true);
    });

    it("rejects an SVG even though its mimetype starts with image/", () => {
        expect(isAllowedUpload("malicious.svg", "image/svg+xml")).toBe(false);
    });

    it("rejects a PHP webshell disguised with an image mimetype", () => {
        expect(isAllowedUpload("shell.php", "image/jpeg")).toBe(false);
    });

    it("rejects a spoofed mimetype on a disallowed extension", () => {
        expect(isAllowedUpload("payload.svg", "image/png")).toBe(false);
    });

    it("rejects an allowed extension paired with a disallowed mimetype", () => {
        expect(isAllowedUpload("photo.jpg", "application/octet-stream")).toBe(false);
    });

    it("rejects non-image mimetypes outright", () => {
        expect(isAllowedUpload("document.pdf", "application/pdf")).toBe(false);
    });

    it("is case-insensitive on the file extension", () => {
        expect(isAllowedUpload("PHOTO.JPG", "image/jpeg")).toBe(true);
    });
});
