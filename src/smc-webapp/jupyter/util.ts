/*
Some simple misc functions with no dependencies.

It's very good to have these as functions rather than put
the code all over the place and have conventions about paths!

part of CoCalc
(c) SageMath, Inc., 2017
*/

// This list is inspired by OutputArea.output_types in https://github.com/jupyter/notebook/blob/master/notebook/static/notebook/js/outputarea.js
// The order matters -- we only keep the left-most type (see import-from-ipynb.coffee)

export const JUPYTER_MIMETYPES = [
  "application/javascript",
  "text/html",
  "text/markdown",
  "text/latex",
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "application/pdf",
  "text/plain"
];

export function codemirror_to_jupyter_pos(
  code: string,
  pos: { ch: number; line: number }
): number {
  const lines = code.split("\n");
  let s = pos.ch;
  for (let i = 0; i < pos.line; i++) {
    s += lines[i].length + 1;
  }
  return s;
}
