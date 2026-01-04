// __previewjs__/Wrapper.tsx

import React from "react";
import "../styles/global.css";

import * as NextImage from "next/image";
import * as NextRouter from "next/router";

const OriginalNextImage = NextImage.default;

// Patch Image to disable optimisations within Preview.js.
Object.defineProperty(NextImage, "default", {
  configurable: true,
  value: (props: NextImage.ImageProps) => (
    <OriginalNextImage {...props} unoptimized />
  ),
});

// Patch useRouter() to fake the router within Preview.js.
Object.defineProperty(NextRouter, "useRouter", {
  configurable: true,
  value: () => ({
    locale: "en-US",
    route: "/",
    pathname: "/",
    query: {},
    asPath: "/",
    push() {
      return Promise.resolve(true);
    },
    replace() {
      return Promise.resolve(true);
    },
    reload() {},
    back() {},
    prefetch() {
      return Promise.resolve();
    },
    beforePopState() {},
    events: {
      on() {},
      off() {},
      emit() {},
    },
    isFallback: false,
  }),
});

