import { ref } from 'vue'

// Whether the "Pickup from" location picker is open (chipotle.com's location modal).
// Module-level so the header, hero, drawer and phone order bar all open the same one.
const open = ref(false)
const tab = ref('pickup')
export function useLocationPicker() {
  return {
    open,
    tab,
    show: (which = 'pickup') => {
      tab.value = which
      open.value = true
    },
    hide: () => (open.value = false),
  }
}
