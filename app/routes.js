import {flatRoutes} from '@react-router/fs-routes';
import {hydrogenRoutes} from '@shopify/hydrogen';

export default hydrogenRoutes([
  ...(await flatRoutes({
    // /pages/visszakuldes (self-serve returns) is parked until the returns
    // flow is reworked in a later release; the footer sends "Visszaküldés"
    // to /pages/contact meanwhile. Remove the entry to bring the route back.
    ignoredRouteFiles: ['**/pages.visszakuldes.jsx'],
  })),
  // Manual route definitions can be added to this array, in addition to or instead of using the `flatRoutes` file-based routing convention.
  // See https://reactrouter.com/api/framework-conventions/routes.ts#routests
]);

/** @typedef {import('@react-router/dev/routes').RouteConfig} RouteConfig */
