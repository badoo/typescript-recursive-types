# ts-recursive-parser

This module allows you to recursively generate type definitions from a Typescript type or program. It's targeted towards other tools or styleguides which can leverage it to display complex information about their components.

This is in pre-pre-alpha stage right now, we have a proof of concept which works.

## Todo

* Expose correct APIs
* Add unit tests
* Document examples
* Double check the shape of returned object, make sure they are consistent
* Add more examples of very complex types
* Improve the building system

# To run it locally

```bash
yarn
tsc index.ts --m commonjs
yarn ts-node index.ts examples/nested-types/index.tsx
```
