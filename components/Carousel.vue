<template>
  <div class="carousel relative h-150">
    <div class="carousel-inner relative overflow-hidden w-full h-full">
      <div v-for="(slide, index) in slides" :key="index" class="carousel-item absolute w-full h-full transition-opacity duration-500" :class="{ 'opacity-0': currentSlide !== index, 'opacity-100': currentSlide === index }" :style="{ backgroundColor: slide.backgroundColor }">
        <img :src="slide.image" :alt="slide.alt" class="w-full h-full object-cover">
        <div class="overlay-image absolute inset-0 flex items-center justify-center transition-transform duration-500" :class="{ 'translate-x-full': currentSlide !== index, 'translate-x-0': currentSlide === index }">
          <img :src="slide.overlay" :alt="slide.alt" class="w-1/2 h-auto object-contain">
        </div>
      </div>
    </div>
    <button @click="prevSlide" class="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-4 py-2">Prev</button>
    <button @click="nextSlide" class="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-4 py-2">Next</button>
  </div>
</template>

<script>
export default {
  name: 'Carousel',
  data() {
    return {
      currentSlide: 0,
      slides: [
        { image: 'https://placehold.co/1440x900/orange/white', overlay: 'https://placehold.co/400x300', alt: 'Slide 1', backgroundColor: 'red' },
        { image: 'https://placehold.co/1440x900/pink/white', overlay: 'https://placehold.co/400x300', alt: 'Slide 2', backgroundColor: 'green' },
        { image: 'https://placehold.co/1440x900/lightblue/white', overlay: 'https://placehold.co/400x300', alt: 'Slide 3', backgroundColor: 'blue' },
      ],
    };
  },
  methods: {
    nextSlide() {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    },
    prevSlide() {
      this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    },
  },
};
</script>

<style scoped>
.carousel-item {
  opacity: 0;
}
.carousel-item.opacity-100 {
  opacity: 1;
}
.overlay-image {
  transform: translateX(100%);
}
.overlay-image.translate-x-0 {
  transform: translateX(0);
}
</style>