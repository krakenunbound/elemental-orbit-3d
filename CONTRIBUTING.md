# Contributing

Thank you for helping improve Elemental Orbit.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install the locked dependencies with `npm ci`.
3. Make the smallest maintainable change that solves the problem.
4. Run `npm run check` before opening a pull request.
5. Describe the visual, scientific, and accessibility impact in the pull request.

## Scientific changes

Scientific accuracy is a release requirement.

- Cite a primary or authoritative source such as IUPAC, CIAAW, NIST, or a peer-reviewed paper.
- State the convention used when multiple defensible conventions exist.
- Add or update a regression test when the claim can be represented programmatically.
- Avoid false precision for radioactive elements or quantities that are predicted rather than measured.
- Preserve the distinction between a relationship visualization and a literal physical atomic model.

## Visual changes

- Keep element symbols and labels more prominent than decorative effects.
- Check Spiral and Sphere views at minimum.
- Respect `prefers-reduced-motion` and compact-display particle scaling.
- Avoid new production dependencies unless the benefit clearly outweighs bundle and maintenance cost.

## Pull requests

Keep pull requests focused. Include:

- the problem and intended behavior;
- screenshots for user-visible changes;
- exact verification commands;
- primary sources for scientific corrections;
- known limitations or follow-up work.
