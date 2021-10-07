## Mockquire & Imports
Mocking esm modules is possible but is not a necessity at the moment.\
Typescript transpiles imports into requires and mockquire does a decent job 
at dealing with them.\
When the day will come that I really need to, I will fully digest [how to mock ESM modules](
https://dev.to/giltayar/mock-all-you-want-supporting-es-modules-in-the-testdouble-js-mocking-library-3gh1
).\
Until then, I am trying not to rely on require and write static and dynamic import hoping that,
if a day I will have to port the tests to real esm modules, that port won't be too painful.