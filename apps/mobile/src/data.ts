import { ImageSourcePropType } from 'react-native';

export type Tab = 'home' | 'diary' | 'groups' | 'profile';
export type Meal = {
  id: string; author: string; initials: string; color: string; mine: boolean;
  time: string; category: string; title: string; caption: string;
  image: ImageSourcePropType; goal: string; feedback?: string; likes: number; groupId: string | null;
  ingredients?: string; earnedPoints?: number; streakBonus?: number; recordedAt?: number;
};

export const photos = [
  { label: 'Salada colorida', image: require('../assets/salad.jpg') },
  { label: 'Salmão e vegetais', image: require('../assets/salmon.jpg') },
  { label: 'Bowl de vegetais', image: require('../assets/bowl.jpg') },
];

export const initialMeals: Meal[] = [
  { id: 'marina', groupId: 'raiz', author: 'Marina Alves', initials: 'MA', color: '#F0DCD4', mine: false,
    time: 'há 18 min', category: 'Almoço', title: 'Mais cor no meu dia',
    caption: 'O almoço de hoje foi assim. Simples, colorido e feito com carinho.',
    image: photos[0].image, goal: 'Mais variedade nas refeições',
    feedback: 'Os diferentes vegetais sugerem variedade de ingredientes, em linha com o hábito que Marina escolheu praticar. A foto não permite confirmar quantidades ou todos os ingredientes.', likes: 12 },
  { id: 'rafa', groupId: 'raiz', author: 'Rafa Lima', initials: 'RL', color: '#DCE6E1', mine: false,
    time: 'há 42 min', category: 'Almoço', title: 'Pausa para um almoço de verdade',
    caption: 'Um momento para sentar, comer e recarregar.',
    image: photos[1].image, goal: 'Manter uma rotina de refeições',
    feedback: 'Registrar a refeição pode ajudar Rafa a acompanhar a própria rotina. Uma foto isolada não permite avaliar a regularidade da alimentação.', likes: 8 },
  { id: 'enzo', groupId: 'raiz', author: 'Você', initials: 'EF', color: '#E7DFF5', mine: true,
    time: 'ontem', category: 'Almoço', title: 'Meu bowl de ontem',
    caption: 'Um passo de cada vez, no meu ritmo.',
    image: photos[2].image, goal: 'Vegetais no almoço',
    feedback: 'Há vegetais visíveis no prato, o que parece se relacionar com o hábito escolhido. Esta é uma leitura ilustrativa, sem avaliação de nutrientes ou porções.', likes: 6 },
];

export const members = [
  { name: 'Marina Alves', initials: 'MA', color: '#F0DCD4', points: 180, goal: 'Mais variedade', streak: 7, mine: false },
  { name: 'Rafa Lima', initials: 'RL', color: '#DCE6E1', points: 145, goal: 'Rotina de refeições', streak: 6, mine: false },
  { name: 'Enzo Fraga', initials: 'EF', color: '#E7DFF5', points: 120, goal: 'Vegetais no almoço', streak: 5, mine: true },
  { name: 'Júlia Costa', initials: 'JC', color: '#F6E6C8', points: 105, goal: 'Cozinhar mais em casa', streak: 4, mine: false },
];
