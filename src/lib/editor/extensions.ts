import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";

// Shared by the client editor and server-side HTML rendering so both use the same schema.
export const postExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: ["http", "https", "mailto"],
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    },
  }),
  Image.configure({ HTMLAttributes: { loading: "lazy" } }),
];
