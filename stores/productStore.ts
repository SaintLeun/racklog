import { defineStore } from 'pinia';

export const useProductStore = defineStore('productStore', {
  state: () => ({
    products: [
      { 
        name: 'rackSelectivo',
        description: 'descriptionRackSelectivo',
        path: 'Slide 1',
        image: '/assets/images/rack-selectivo-card.png',
      },
      { 
        name: 'anguloRanurado',
        description: 'descriptionAnguloRanurado',
        path: 'Slide2',
        image: '/assets/images/rack-selectivo-card.png',
      },
      { 
        name: 'rackPushback',
        description: 'descriptionRackPushback',
        path: 'Slide2',
        image: '/assets/images/rack-selectivo-card.png',
      },
      { 
        name: 'rackSelectivo',
        description: 'descriptionRackSelectivo',
        path: 'Slide 1',
        image: '/assets/images/rack-selectivo-card.png',
      },
      { 
        name: 'anguloRanurado',
        description: 'descriptionAnguloRanurado',
        path: 'Slide2',
        image: '/assets/images/rack-selectivo-card.png',
      },
      { 
        name: 'rackPushback',
        description: 'descriptionRackPushback',
        path: 'Slide2',
        image: '/assets/images/rack-selectivo-card.png',
      },
      { 
        name: 'rackSelectivo',
        description: 'descriptionRackSelectivo',
        path: 'Slide 1',
        image: '/assets/images/rack-selectivo-card.png',
      },
      { 
        name: 'anguloRanurado',
        description: 'descriptionAnguloRanurado',
        path: 'Slide2',
        image: '/assets/images/rack-selectivo-card.png',
      },
      { 
        name: 'rackPushback',
        description: 'descriptionRackPushback',
        path: 'Slide2',
        image: '/assets/images/rack-selectivo-card.png',
      },
    ],
  }),
});