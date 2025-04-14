<template>
  <transition name="fade">
    <div v-if="isVisible" class="fixed inset-0 flex items-center justify-center bg-black/60 z-50 overflow-y-auto py-4">
      <div class="min-h-screen flex items-center justify-center w-full">
        <transition name="modal">
          <div class="bg-white rounded-2xl overflow-hidden w-full max-w-7xl max-h-[calc(100vh-2rem)] my-auto mx-4 shadow-2xl transform transition-all duration-300 ease-out">
            <!-- Modal Header with branded accent -->
            <div class="h-1.5 bg-gradient-to-r from-orange-500 to-orange-400"></div>
            
            <div class="p-6 bg-gray-50">
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center">
                  <h2 class="text-2xl font-bold text-gray-800">
                    {{ title || 'Configurador de Producto' }}
                  </h2>
                  <span class="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    Personalizable
                  </span>
                </div>
                
                <!-- Cart Preview Button & Close -->
                <div class="flex items-center space-x-3">
                  <button 
                    @click="goToCart" 
                    class="flex items-center text-gray-700 hover:text-orange-600 bg-white py-2 px-4 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all"
                  >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    Mi Cotización
                    <span v-if="cartCount > 0" class="ml-2 flex items-center justify-center bg-orange-500 text-white rounded-full w-5 h-5 text-xs font-bold">
                      {{ cartCount }}
                    </span>
                  </button>
                  
                  <button 
                    @click="closeModal" 
                    class="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Cerrar configurador"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Progress Bar - Shows configuration steps -->
              <div class="w-full bg-gray-200 rounded-full h-1.5 mb-6">
                <div class="bg-orange-500 h-1.5 rounded-full" :style="`width: ${configurationProgress}%`"></div>
              </div>
              
              <div class="overflow-y-auto" style="max-height: calc(100vh - 12rem);">
                <section class="text-gray-600 body-font relative w-full">
                  <div class="container mx-auto flex flex-col lg:flex-row">
                    <!-- Configuration Panel -->
                    <div class="w-full lg:w-1/3 p-4">
                      <!-- Product Type Selection -->
                      <div class="mb-6">
                        <div class="grid grid-cols-2 gap-4">
                          <button
                            @click="selectedProduct = 'AR'"
                            class="group relative overflow-hidden transition-all"
                          >
                            <div :class="[
                              'rounded-xl p-4 flex flex-col items-center transition-all duration-300 border-2',
                              selectedProduct === 'AR' 
                                ? 'border-orange-500 bg-orange-50 shadow-md' 
                                : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                            ]">
                              <div class="relative mb-2 rounded-lg overflow-hidden bg-white h-28 w-full flex items-center justify-center p-2">
                                <img
                                  src="/assets/images/anra_body.png"
                                  alt="Ángulo Ranurado"
                                  class="h-24 w-auto object-contain transition-transform group-hover:scale-105"
                                />
                              </div>
                              <span class="font-medium text-gray-900">Ángulo Ranurado</span>
                              
                              <!-- Selected Check Indicator -->
                              <div v-if="selectedProduct === 'AR'" class="absolute top-2 right-2 h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                            </div>
                          </button>
                          
                          <button
                            @click="selectedProduct = 'RS'"
                            class="group relative overflow-hidden transition-all"
                          >
                            <div :class="[
                              'rounded-xl p-4 flex flex-col items-center transition-all duration-300 border-2',
                              selectedProduct === 'RS' 
                                ? 'border-orange-500 bg-orange-50 shadow-md' 
                                : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                            ]">
                              <div class="relative mb-2 rounded-lg overflow-hidden bg-white h-28 w-full flex items-center justify-center p-2">
                                <img
                                  src="/assets/images/rack_selectivo.jpg"
                                  alt="Rack Selectivo"
                                  class="h-24 w-auto object-contain transition-transform group-hover:scale-105"
                                />
                              </div>
                              <span class="font-medium text-gray-900">Rack Selectivo</span>
                              
                              <!-- Selected Check Indicator -->
                              <div v-if="selectedProduct === 'RS'" class="absolute top-2 right-2 h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                      
                      <!-- Configuration Options -->
                      <div v-if="selectedProduct" class="space-y-5">

                        <!-- Type Option -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div class="px-5 py-2 border-b border-gray-100">
                            <h3 class="font-medium text-gray-900">Tipo</h3>
                          </div>
                          <div class="px-5 py-4">
                            <div class="flex space-x-3">
                              <button
                                @click="config.tipo = 'simple'"
                                :class="[
                                  'flex-1 px-4 py-2 rounded-lg transition-all duration-200 border',
                                  config.tipo === 'simple' 
                                    ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                                ]"
                              >
                                Simple
                              </button>
                              <button
                                @click="config.tipo = 'doble'"
                                :class="[
                                  'flex-1 px-4 py-2 rounded-lg transition-all duration-200 border',
                                  config.tipo === 'doble' 
                                    ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                                ]"
                              >
                                Doble
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Levels Option -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div class="px-5 py-2 border-b border-gray-100">
                            <h3 class="font-medium text-gray-900">Altura (Niveles)</h3>
                          </div>
                          <div class="px-5 py-4">
                            <div class="flex items-center mb-2">
                              <div class="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  class="bg-orange-500 h-2 rounded-full transition-all"
                                  :style="`width: ${(config.niveles - 2) / 8 * 100}%`"
                                ></div>
                              </div>
                            </div>
                            <div class="flex items-center justify-between">
                              <button
                                @click="config.niveles > 2 ? config.niveles-- : ''"
                                :class="[
                                  'h-9 w-9 rounded-full flex items-center justify-center transition-colors', 
                                  config.niveles > 2 
                                    ? 'text-gray-700 hover:bg-gray-100' 
                                    : 'text-gray-400 cursor-not-allowed'
                                ]"
                                :disabled="config.niveles <= 2"
                              >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                </svg>
                              </button>
                              
                              <div class="flex flex-col items-center">
                                <span class="text-3xl font-bold text-gray-900">{{ config.niveles }}</span>
                                <span class="text-xs text-gray-500">niveles</span>
                              </div>
                              
                              <button
                                @click="config.niveles < 10 ? config.niveles++ : ''"
                                :class="[
                                  'h-9 w-9 rounded-full flex items-center justify-center transition-colors', 
                                  config.niveles < 10 
                                    ? 'text-gray-700 hover:bg-gray-100' 
                                    : 'text-gray-400 cursor-not-allowed'
                                ]"
                                :disabled="config.niveles >= 10"
                              >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Bodies Option -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div class="px-5 py-2 border-b border-gray-100">
                            <h3 class="font-medium text-gray-900">Ancho (Cuerpos)</h3>
                          </div>
                          <div class="px-5 py-4">
                            <div class="flex items-center mb-2">
                              <div class="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  class="bg-orange-500 h-2 rounded-full transition-all"
                                  :style="`width: ${(config.cuerpos - 1) / 9 * 100}%`"
                                ></div>
                              </div>
                            </div>
                            <div class="flex items-center justify-between">
                              <button
                                @click="config.cuerpos > 1 ? config.cuerpos-- : ''"
                                :class="[
                                  'h-9 w-9 rounded-full flex items-center justify-center transition-colors', 
                                  config.cuerpos > 1 
                                    ? 'text-gray-700 hover:bg-gray-100' 
                                    : 'text-gray-400 cursor-not-allowed'
                                ]"
                                :disabled="config.cuerpos <= 1"
                              >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                </svg>
                              </button>
                              
                              <div class="flex flex-col items-center">
                                <span class="text-3xl font-bold text-gray-900">{{ config.cuerpos }}</span>
                                <span class="text-xs text-gray-500">cuerpos</span>
                              </div>
                              
                              <button
                                @click="config.cuerpos < 10 ? config.cuerpos++ : ''"
                                :class="[
                                  'h-9 w-9 rounded-full flex items-center justify-center transition-colors', 
                                  config.cuerpos < 10 
                                    ? 'text-gray-700 hover:bg-gray-100' 
                                    : 'text-gray-400 cursor-not-allowed'
                                ]"
                                :disabled="config.cuerpos >= 10"
                              >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Angle Slotted specific options -->
                        <template v-if="selectedProduct === 'AR'">
                          <!-- Finishing Option -->
                          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div class="px-5 py-2 border-b border-gray-100">
                              <h3 class="font-medium text-gray-900">Acabado</h3>
                            </div>
                            <div class="px-5 py-4">
                              <div class="flex space-x-3">
                                <button
                                  @click="config.pintado = 'galvanizado'"
                                  :class="[
                                    'flex-1 px-4 py-2 rounded-lg transition-all duration-200 border',
                                    config.pintado === 'galvanizado' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  Galvanizado
                                </button>
                                <button
                                  @click="config.pintado = 'pintado'"
                                  :class="[
                                    'flex-1 px-4 py-2 rounded-lg transition-all duration-200 border',
                                    config.pintado === 'pintado' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  Pintado
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Load Capacity -->
                          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div class="px-5 py-2 border-b border-gray-100">
                              <h3 class="font-medium text-gray-900">Capacidad de Carga</h3>
                            </div>
                            <div class="px-5 py-4">
                              <div class="grid grid-cols-3 gap-3">
                                <button
                                  @click="config.carga = '90kg'"
                                  :class="[
                                    'px-4 py-2 rounded-lg transition-all duration-200 border text-center',
                                    config.carga === '90kg' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  90 kg
                                </button>
                                <button
                                  @click="config.carga = '150kg'"
                                  :class="[
                                    'px-4 py-2 rounded-lg transition-all duration-200 border text-center',
                                    config.carga === '150kg' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  150 kg
                                </button>
                                <button
                                  @click="config.carga = '250kg'"
                                  :class="[
                                    'px-4 py-2 rounded-lg transition-all duration-200 border text-center',
                                    config.carga === '250kg' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  250 kg
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Shelf Depth -->
                          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div class="px-5 py-2 border-b border-gray-100">
                              <h3 class="font-medium text-gray-900">Profundidad de Bandeja</h3>
                            </div>
                            <div class="px-5 py-4">
                              <div class="grid grid-cols-2 gap-3">
                                <button
                                  @click="config.bandeja = '300mm'"
                                  :class="[
                                    'px-4 py-2 rounded-lg transition-all duration-200 border text-center',
                                    config.bandeja === '300mm' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  300 mm
                                </button>
                                <button
                                  @click="config.bandeja = '400mm'"
                                  :class="[
                                    'px-4 py-2 rounded-lg transition-all duration-200 border text-center',
                                    config.bandeja === '400mm' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  400 mm
                                </button>
                                <button
                                  @click="config.bandeja = '460mm'"
                                  :class="[
                                    'px-4 py-2 rounded-lg transition-all duration-200 border text-center',
                                    config.bandeja === '460mm' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  460 mm
                                </button>
                                <button
                                  @click="config.bandeja = '600mm'"
                                  :class="[
                                    'px-4 py-2 rounded-lg transition-all duration-200 border text-center',
                                    config.bandeja === '600mm' 
                                      ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium shadow-sm' 
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  ]"
                                >
                                  600 mm
                                </button>
                              </div>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                    
                    <!-- Preview Panel -->
                    <div class="w-full lg:w-2/3 flex flex-col p-4 relative">
                      <!-- Model Preview -->
                      <div class="relative w-full h-[450px] md:h-[500px] lg:h-[550px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200">
                        <!-- Empty state - when no product is selected -->
                        <div v-if="!selectedProduct" class="text-center p-6">
                          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                          </svg>
                          <h3 class="text-xl font-medium text-gray-600 mb-2">Selecciona un producto</h3>
                          <p class="text-gray-500">Elige un tipo de producto para configurar y visualizar</p>
                        </div>
                        
                        <!-- Loading Overlay -->
                        <transition name="fade">
                          <div
                            v-if="loading"
                            class="absolute inset-0 flex flex-col justify-center items-center bg-white/90 z-10"
                          >
                            <svg class="animate-spin h-10 w-10 text-orange-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p class="text-gray-600 font-medium">Cargando modelo 3D...</p>
                          </div>
                        </transition>
                        
                        <!-- 3D Model Display -->
                        <iframe
                          v-if="!loading && model && selectedProduct"
                          title="Modelo 3D"
                          class="w-full h-full"
                          frameborder="0"
                          allowfullscreen
                          mozallowfullscreen="true"
                          webkitallowfullscreen="true"
                          allow="autoplay; fullscreen; xr-spatial-tracking"
                          xr-spatial-tracking
                          execution-while-out-of-viewport
                          execution-while-not-rendered
                          web-share
                          :src="model"
                        ></iframe>
                        
                        <!-- Error State -->
                        <div v-else-if="!loading && !model && selectedProduct" class="text-center p-6">
                          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                          </svg>
                          <h3 class="text-xl font-medium text-gray-600 mb-2">No se encontró el modelo</h3>
                          <p class="text-gray-500">Intenta con otra configuración o contacta con soporte.</p>
                        </div>
                      </div>
                      
                      <!-- Summary and Add to Cart Section -->
                      <div class="mt-5 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div class="flex flex-col md:flex-row md:items-center">
                          <!-- Configuration Summary -->
                          <div class="flex-grow mb-4 md:mb-0">
                            <h3 class="font-semibold text-gray-900 mb-1">Configuración Actual</h3>
                            <p class="text-sm text-gray-600">
                              {{ selectedProduct ? (selectedProduct === 'AR' ? 'Ángulo Ranurado' : 'Rack Selectivo') : 'Ningún producto seleccionado' }}
                              <template v-if="selectedProduct">
                                {{ config.tipo === 'simple' ? 'Simple' : 'Doble' }}, 
                                {{ config.niveles }} niveles, 
                                {{ config.cuerpos }} cuerpos
                                <template v-if="selectedProduct === 'AR' && config.carga">
                                  , Capacidad: {{ config.carga }}
                                </template>
                                <template v-if="selectedProduct === 'AR' && config.bandeja">
                                  , Bandeja: {{ config.bandeja }}
                                </template>
                              </template>
                            </p>
                          </div>
                          
                          <div class="flex items-center space-x-3">
                            <!-- Quantity Selector -->
                            <div class="flex items-center border border-gray-300 rounded-lg bg-white">
                              <button 
                                @click="quantity > 1 ? quantity-- : null" 
                                class="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg border-r border-gray-200"
                                :disabled="quantity <= 1"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                </svg>
                              </button>
                              <span class="px-4 py-2 text-center w-12 font-medium">{{ quantity }}</span>
                              <button 
                                @click="quantity++" 
                                class="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg border-l border-gray-200"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                              </button>
                            </div>
                            
                            <!-- Add to Cart Button -->
                            <button
                              @click="addToCart"
                              class="flex-grow h-12 text-white bg-orange-500 border-0 py-2 px-6 focus:outline-none hover:bg-orange-600 rounded-lg text-base font-medium relative overflow-hidden shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                              :disabled="!isConfigurationComplete || isAddingToCart"
                            >
                              <span v-if="!isAddingToCart">Añadir</span>
                              <span v-else class="flex items-center justify-center">
                                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Añadiendo...
                              </span>
                              
                              <!-- Success overlay animation -->
                              <span 
                                v-if="showSuccessOverlay" 
                                class="absolute inset-0 bg-green-500 flex items-center justify-center transition-opacity duration-300"
                                :class="{'opacity-100': showSuccessOverlay, 'opacity-0': !showSuccessOverlay}"
                              >
                                <svg class="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                ¡Añadido!
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>
  
  <!-- Toast Notification for Added to Cart -->
  <Teleport to="body">
    <transition name="toast">
      <div 
        v-if="showCartNotification" 
        class="fixed top-4 right-4 bg-white rounded-xl shadow-xl p-4 flex items-center z-50 max-w-md border border-gray-100 transform transition-all duration-300"
      >
        <div class="bg-green-100 rounded-lg p-2 mr-4 flex-shrink-0">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-800 truncate">Producto añadido a la cotización</p>
          <p class="text-sm text-gray-600 truncate">{{ lastAddedProduct }}</p>
        </div>
        <div class="flex items-center ml-4 flex-shrink-0">
          <button @click="goToCart" class="px-3 py-1 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 mr-2">
            Ver cotización
          </button>
          <button @click="closeNotification" class="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import axios from 'axios';
import { useCartStore } from '../stores/cartStore'; // Import the cart store
import { storeToRefs } from 'pinia'; // Import storeToRefs
import { useRouter } from 'vue-router'; // Import useRouter

const selectedProduct = ref('');
const config = ref({
  tipo: '',
  niveles: 2,
  cuerpos: 1,
  carga: '', // Specific to AR
  pintado: '', // Specific to AR
  bandeja: '', // Specific to AR
});

const model = ref('');
const loading = ref(false); // Loading state for the model
const token = 'eaaffe4a07a4587dc4fc7be6a145e65f'; // Replace with your Sketchfab API token
const user = 'racklog.cl'; // Replace with your Sketchfab username

const quantity = ref(1);
const isAddingToCart = ref(false);
const showSuccessOverlay = ref(false);

// Cart notification
const showCartNotification = ref(false);
const lastAddedProduct = ref('');
let notificationTimeout: number | null = null;

// Configuration progress - shows percentage of completed configuration steps
const configurationProgress = computed(() => {
  if (!selectedProduct.value) return 0;
  
  let totalFields = 0;
  let completedFields = 0;
  
  // Product selection counts as one completed field
  totalFields++;
  completedFields++;
  
  // Common fields for both products
  totalFields += 3; // tipo, niveles, cuerpos
  if (config.value.tipo) completedFields++;
  // niveles and cuerpos always have values so they're always complete
  completedFields += 2;
  
  // Additional fields for AR
  if (selectedProduct.value === 'AR') {
    totalFields += 3; // pintado, carga, bandeja
    if (config.value.pintado) completedFields++;
    if (config.value.carga) completedFields++;
    if (config.value.bandeja) completedFields++;
  }
  
  return Math.round((completedFields / totalFields) * 100);
});

// Check if all required configuration options are selected
const isConfigurationComplete = computed(() => {
  if (!selectedProduct.value) return false;
  
  // Common requirements for all products
  const basicConfigComplete = Boolean(
    config.value.tipo && 
    config.value.niveles >= 2 && 
    config.value.cuerpos >= 1
  );
  
  // Additional AR-specific requirements
  if (selectedProduct.value === 'AR') {
    return basicConfigComplete && 
           Boolean(config.value.pintado) && 
           Boolean(config.value.carga) && 
           Boolean(config.value.bandeja);
  }
  
  // For RS or other products, just the basic config is needed
  return basicConfigComplete;
});

// Estimated price calculation based on configuration
const estimatedPrice = computed(() => {
  if (!selectedProduct.value) return 0;
  
  // Base prices by product type
  let basePrice = selectedProduct.value === 'AR' ? 12000 : 50000;
  let nivelPrice = selectedProduct.value === 'AR' ? 5000 : 15000;
  let cuerpoPrice = selectedProduct.value === 'AR' ? 8000 : 25000;
  
  // Adjust for tipo
  if (config.value.tipo === 'doble') basePrice *= 1.8;
  
  // Specific adjustments for AR
  if (selectedProduct.value === 'AR') {
    // Adjust for pintado
    if (config.value.pintado === 'pintado') basePrice *= 1.2;
    
    // Adjust for load capacity
    if (config.value.carga === '150kg') basePrice *= 1.3;
    if (config.value.carga === '250kg') basePrice *= 1.5;
    
    // Adjust for bandeja size
    if (config.value.bandeja === '400mm') nivelPrice *= 1.2;
    if (config.value.bandeja === '460mm') nivelPrice *= 1.3;
    if (config.value.bandeja === '600mm') nivelPrice *= 1.5;
  }
  
  // Calculate total price
  return Math.round(basePrice + (nivelPrice * config.value.niveles) + (cuerpoPrice * config.value.cuerpos));
});

// Format price with thousand separators for display
function formatPrice(price) {
  return new Intl.NumberFormat('es-CL').format(price);
}

// In QuoteModal.vue, add this to the props section:
const props = defineProps({
  isVisible: Boolean,
  title: String,
  initialProduct: {
    type: String,
    default: ''
  }
});

// And then in the setup code, watch for initialProduct changes:
watch(() => props.initialProduct, (newValue) => {
  if (newValue) {
    selectedProduct.value = newValue;
  }
}, { immediate: true });

const emit = defineEmits(['close']);

const cartStore = useCartStore(); // Initialize the cart store
const { cartCount } = storeToRefs(cartStore); // Get reactive cart count

const router = useRouter(); // Initialize router

function closeModal() {
  emit('close');
}

function goToCart() {
  router.push('/carrito');
  closeModal(); // Close the modal when navigating to cart
}

function closeNotification() {
  showCartNotification.value = false;
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
}

// Watch for product type changes to reset configuration
watch(selectedProduct, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    // Reset configuration when product type changes
    config.value = {
      tipo: 'simple',
      niveles: 2,
      cuerpos: 1,
      carga: '', 
      pintado: '',
      bandeja: ''
    };
  }
});

watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// Computed property to generate the concatenated string
const productCode = computed(() => {
  if (!selectedProduct.value) return '';

  const tipoCode = config.value.tipo === 'doble' ? '2' : ''; // 2 for Doble, empty for Simple
  const cuerposCode = `${config.value.cuerpos}M`; // Number of cuerpos followed by 'M'
  const nivelesCode = `${config.value.niveles}E`; // Number of niveles followed by 'E'

  return `${selectedProduct.value}${tipoCode}_${cuerposCode}_${nivelesCode}`;
});

// Function to fetch the UUID from Sketchfab API using axios
async function fetchModelUUID(modelo: string) {
  try {
    loading.value = true; // Start loading
    const response = await axios.get('https://api.sketchfab.com/v3/search', {
      headers: {
        Authorization: `Token ${token}`,
      },
      params: {
        type: 'models',
        q: modelo,
        user: user,
      },
    });

    const resultData = response.data;
    const uuid = resultData.results[0]?.uid;

    if (uuid) {
      model.value = `https://sketchfab.com/models/${uuid}/embed?ui_theme=dark`;
    } else {
      console.error('No UUID found for the given model');
    }
  } catch (error) {
    console.error('Error fetching UUID:', error);
  } finally {
    loading.value = false; // Stop loading
  }
}

// Watcher to fetch the UUID whenever the productCode changes
watch(productCode, (newCode) => {
  if (newCode) {
    fetchModelUUID(newCode);
  }
});

// Function to add the generated product to the cart
async function addToCart() {
  if (!selectedProduct.value || isAddingToCart.value) return;
  
  isAddingToCart.value = true;
  
  // Define product properties based on the currently configured product
  const productName = selectedProduct.value === 'AR' ? 'Ángulo Ranurado' : 'Rack Selectivo';
  const configDescription = `${config.value.tipo === 'simple' ? 'Simple' : 'Doble'}, ${config.value.niveles} niveles, ${config.value.cuerpos} cuerpos`;
  
  // Calculate price based on selected product and configuration
  let basePrice = selectedProduct.value === 'AR' ? 10000 : 50000;
  let nivelPrice = selectedProduct.value === 'AR' ? 5000 : 15000;
  let cuerpoPrice = selectedProduct.value === 'AR' ? 8000 : 20000;
  
  const price = basePrice + (nivelPrice * config.value.niveles) + (cuerpoPrice * config.value.cuerpos);
  
  const product = {
    id: productCode.value,
    name: productName,
    price: price,
    quantity: quantity.value,
    config: { ...config.value }, // Create a copy of the config object
  };

  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  cartStore.addToCart(product); // Add the product to the cart store
  
  // Show success overlay
  showSuccessOverlay.value = true;
  setTimeout(() => {
    showSuccessOverlay.value = false;
    isAddingToCart.value = false;
  }, 1200);
  
  // Reset quantity after adding to cart
  quantity.value = 1;
  
  // Show notification toast
  lastAddedProduct.value = `${productName} - ${configDescription} (${quantity.value})`;
  showCartNotification.value = false;
  showCartNotification.value = true;
  
  // Auto-hide notification after 5 seconds
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  notificationTimeout = window.setTimeout(() => {
    showCartNotification.value = false;
  }, 5000);
}
</script>

<style scoped>


/* Define the transition effects for the backdrop */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Define the transition effects for the modal */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Toast notification animation */
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  transform: translateY(-20px) translateX(20px);
  opacity: 0;
}
</style>