import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { findStore, isOrderable } from '@/order/lib/catalog'
import { goPath } from '@/order/lib/go'
import { useOrder } from '@/order/useOrder'
import locationList from '@/data/locations.json'
import { locationStats } from '@/utils/locations'

const BRAND = 'Guacado Mexican Grill'
const stats = locationStats(locationList)

// Menu, Catering and Locations get their own routes; Order, Jobs and Franchise stay
// external (see src/data/site.js).
export const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: `${BRAND} · Bowls, Tacos & Mexican Favorites`, description: `Build your own bowls, enjoy birria tacos, burritos and family kits. Order pickup at ${stats.open} Guacado locations across ${stats.states} states.` } },
  { path: '/menu', name: 'menu', component: () => import('@/views/MenuView.vue'), meta: { title: 'Guacado Menu · Bowls, Tacos, Burritos & More', description: `Explore Guacado's menu of bowls, tacos, burritos, family kits, sides and drinks. Build your own and order pickup.` } },
  { path: '/catering', name: 'catering', component: () => import('@/views/CateringView.vue'), meta: { title: 'Guacado Catering · Mexican Food for Every Gathering', description: 'Bring Guacado to birthdays, office lunches, weddings and game days. Explore catering packages and plan your food spread.' } },
  { path: '/locations', name: 'locations', component: () => import('@/views/LocationsView.vue'), meta: { title: 'Find a Guacado Near You · Order Mexican Food for Pickup', description: `Find a Guacado location near you. Explore the menu and order pickup. Open daily from 10:30am to 3am across ${stats.states} states.` } },
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
      { path: ':store/build', name: 'order-build', component: () => import('@/order/views/OrderBuilderView.vue'), props: true, meta: { title: `Build your own · ${BRAND}` } },
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
