<template>
  <div class="carousel relative h-150">
    <div class="carousel-inner relative overflow-hidden w-full h-full">
      <div v-for="(slide, index) in slides" :key="index" class="carousel-item absolute w-full h-full duration-500" :class="{ 'opacity-100': currentSlide === index, 'opacity-0': currentSlide !== index }">
        <div class="flex h-full">
          <img :src="slide.image" :alt="slide.alt" class="w-full h-full object-cover">
          <div class="overlay-image absolute inset-0 flex items-center justify-center transition-transform duration-500" :class="{ 'translate-x-full': currentSlide !== index, 'translate-x-0': currentSlide === index }">
            <img :src="slide.overlay" :alt="slide.alt" class="object-contain">
            <div class="text-card p-4 bg-white rounded shadow-lg">
              <h2 class="text-2xl font-bold mb-4">{{ slide.title }}</h2>
              <p class="text-base">{{ slide.description }}</p>
            </div>
          </div>
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
        { image: '/assets/images/slide-1.png', overlay: 'https://qa.racklog.cl/images/slider/silder_1/palletslider1.png', alt: 'Slide 1', title: 'Slide 1 Title', description: 'Description for Slide 1' },
        { image: '/assets/images/slide-2.png', overlay: 'https://qa.racklog.cl/images/slider/silder_1/palletslider1.png', alt: 'Slide 2', title: 'Slide 2 Title', description: 'Description for Slide 2' },
        { image: '/assets/images/slide-3.png', overlay: 'https://qa.racklog.cl/images/slider/silder_1/palletslider1.png', alt: 'Slide 3', title: 'Slide 3 Title', description: 'Description for Slide 3' },
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
  mounted() {
    this.currentSlide = 0;
  }
};
</script>

<style scoped>

  .carousel-inner img {
    object-position: bottom;
  }
  .text-card {
    max-height: 80%;
  }
</style>