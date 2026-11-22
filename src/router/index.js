import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { findStore, isOrderable } from '@/order/lib/catalog'
import { goPath } from '@/order/lib/go'
import { useOrder } from '@/order/useOrder'
import locationList from '@/data/locations.json'
import { locationStats } from '@/utils/locations'

const BRAND = 'Fresh Guacado Mexican Grill'
const stats = locationStats(locationList)

// Menu, Catering and Locations get their own routes; Order, Jobs and Franchise stay
// external (see src/data/site.js).
export const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: `${BRAND} · Bowls, Tacos & Mexican Favorites`, description: `Build your own bowls, enjoy birria tacos, burritos and family kits. Order pickup at ${stats.open} Fresh Guacado locations across ${stats.states} states.` } },
  { path: '/menu', name: 'menu', component: () => import('@/views/MenuView.vue'), meta: { title: 'Fresh Guacado Menu · Bowls, Tacos, Burritos & More', description: `Explore Fresh Guacado's menu of bowls, tacos, burritos, family kits, sides and drinks. Build your own and order pickup.` } },
  { path: '/catering', name: 'catering', component: () => import('@/views/CateringView.vue'), meta: { title: 'Fresh Guacado Catering · Mexican Food for Every Gathering', description: 'Bring Fresh Guacado to birthdays, office lunches, weddings and game days. Explore catering packages and plan your food spread.' } },
  { path: '/locations', name: 'locations', component: () => import('@/views/LocationsView.vue'), meta: { title: 'Find a Fresh Guacado Near You · Order Mexican Food for Pickup', description: `Find a Fresh Guacado location near you. Explore the menu and order pickup. Open daily from 10:30am to 3am across ${stats.states} states.` } },
  { path: '/values', name: 'values', component: () => import('@/views/ValuesView.vue'), meta: { title: `Our Values · ${BRAND}`, description: 'Guac mashed in-house, homemade sauces and a fresh selection of toppings: how Fresh Guacado makes every meal.' } },
  {
    // Mobile-first pickup ordering. Own shell (no marketing header/footer): meta.order hides them in App.vue.
    path: '/order',
    component: () => import('@/order/views/OrderShell.vue'),
    meta: { order: true },
    children: [
      {
        path: '',
        name: 'order',
        component: () => import('@/order/views/OrderLocationView.vue'),
        meta: { title: `Order pickup · ${BRAND}` },
        // A remembered, orderable store skips the picker (LOC-03). "?change" forces it.
        beforeEnter: (to) => {
          const slug = useOrder().state.storeSlug
          if (slug && !to.query.change) return { ...goPath(slug, to.query.go), replace: true }
        },
      },
      { path: 'checkout', name: 'order-checkout', component: () => import('@/order/views/OrderCheckoutView.vue'), meta: { title: `Checkout · ${BRAND}` } },
      { path: ':store', name: 'order-menu', component: () => import('@/order/views/OrderMenuView.vue'), props: true, meta: { title: `Order · ${BRAND}` } },
      { path: ':store/build', name: 'order-build', component: () => import('@/order/views/OrderBuilderView.vue'), props: true, meta: { title: `Build your own · ${BRAND}`, wide: true } },
      { path: ':store/family', name: 'order-family', component: () => import('@/order/views/OrderFamilyView.vue'), props: true, meta: { title: `Family meals · ${BRAND}`, wide: true } },
      { path: ':store/family/:slug', name: 'order-family-kit', component: () => import('@/order/views/OrderFamilyView.vue'), props: true, meta: { title: `Build your family meal · ${BRAND}`, wide: true } },
      { path: ':store/kids', name: 'order-kids', component: () => import('@/order/views/OrderKidsView.vue'), props: true, meta: { title: `Kids meal · ${BRAND}`, wide: true } },
      { path: ':store/kids/:slug', name: 'order-kids-item', component: () => import('@/order/views/OrderKidsView.vue'), props: true, meta: { title: `Build your kids meal · ${BRAND}`, wide: true } },
      { path: ':store/drinks', name: 'order-drinks', component: () => import('@/order/views/OrderShelfView.vue'), props: (r) => ({ store: r.params.store, kind: 'drinks' }), meta: { title: `Drinks · ${BRAND}`, wide: true } },
      { path: ':store/sides', name: 'order-sides', component: () => import('@/order/views/OrderShelfView.vue'), props: (r) => ({ store: r.params.store, kind: 'sides' }), meta: { title: `Sides & dips · ${BRAND}`, wide: true } },
      { path: ':store/desserts', name: 'order-desserts', component: () => import('@/order/views/OrderShelfView.vue'), props: (r) => ({ store: r.params.store, kind: 'desserts' }), meta: { title: `Desserts · ${BRAND}`, wide: true } },
      { path: ':store/catering/:slug', name: 'order-catering', component: () => import('@/order/views/OrderCateringView.vue'), props: true, meta: { title: `Catering order · ${BRAND}`, wide: true } },
      { path: ':store/item/:slug', name: 'order-item', component: () => import('@/order/views/OrderItemView.vue'), props: true, meta: { title: `Order · ${BRAND}` } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: `Page not found · ${BRAND}` } },
]

export function createAppRouter(history = createWebHistory()) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior(to, from, saved) {
      if (saved) return saved
      // Same page, only the query changed (e.g. the builder's ?step / ?base): stay where we are.
      if (from.matched.length && to.path === from.path && to.hash === from.hash) return false
      // The builder scrolls itself to ?step (e.g. after a refresh); don't jump back to the top.
      if (to.name === 'order-build' && to.query.step) return false
      // Header is 68px; the menu page adds a 56px sticky tab bar.
      if (to.hash) return { el: to.hash, top: to.path === '/menu' ? 132 : 76, behavior: 'smooth' }
      return { top: 0, behavior: 'instant' }
    },
  })
  // Only OPEN stores are orderable; a stale or "coming soon" link goes back to the picker.
  router.beforeEach((to) => {
    if (!to.params.store) return
    if (!isOrderable(findStore(to.params.store))) return { path: '/order', query: { change: 1 } }
    useOrder().chooseStore(to.params.store)
  })
  router.afterEach((to) => {
    document.title = to.meta.title ?? BRAND
    const desc = to.meta.description
    const tag = document.querySelector('meta[name="description"]')
    if (desc && tag) tag.setAttribute('content', desc)
  })
  return router
}

export default createAppRouter()
