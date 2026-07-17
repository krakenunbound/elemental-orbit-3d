import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [
    {
      name: "same-origin-stylesheet",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          return html.replace(/(<link\s+rel="stylesheet")\s+crossorigin/g, "$1");
        },
      },
    },
  ],
});
