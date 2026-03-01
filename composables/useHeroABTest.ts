import { ref, computed } from 'vue'

// A/B Test configuration
const HERO_AB_TEST_KEY = 'hero_variant_test'
const VARIANTS = {
  ORIGINAL: 'original_carousel',
  NEW: 'new_hero'
}

export function useHeroABTest() {
  const selectedVariant = ref<string | null>(null)
  
  // Initialize A/B test
  const initializeTest = () => {
    if (typeof window === 'undefined') return
    
    // Check for URL parameter override (for testing)
    const urlParams = new URLSearchParams(window.location.search)
    const forceVariant = urlParams.get('variant')
    if (forceVariant && Object.values(VARIANTS).includes(forceVariant)) {
      selectedVariant.value = forceVariant
      return
    }
    
    // Check if user already has a variant assigned
    let storedVariant = localStorage.getItem(HERO_AB_TEST_KEY)
    
    if (!storedVariant || !Object.values(VARIANTS).includes(storedVariant)) {
      // Randomly assign variant (50/50 split)
      storedVariant = Math.random() < 0.5 ? VARIANTS.ORIGINAL : VARIANTS.NEW
      localStorage.setItem(HERO_AB_TEST_KEY, storedVariant)
      
      // Track assignment event
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'ab_test_assignment',
          ab_test_name: 'hero_variant',
          ab_test_variant: storedVariant,
          ab_test_split: '50/50'
        })
      }
    }
    
    selectedVariant.value = storedVariant
  }
  
  // Computed properties for easy variant checking
  const isOriginalVariant = computed(() => selectedVariant.value === VARIANTS.ORIGINAL)
  const isNewVariant = computed(() => selectedVariant.value === VARIANTS.NEW)
  
  // Get current variant
  const getCurrentVariant = () => selectedVariant.value
  
  return {
    initializeTest,
    isOriginalVariant,
    isNewVariant,
    getCurrentVariant,
    VARIANTS
  }
}
