import { Brain, Compass, Globe, Sparkles, Microscope, Lightbulb } from 'lucide-react';

export interface Question {
  id: string;
  text: string;
  dhivehiText: string;
  category: string;
  icon: any;
  answers: number;
}

export const featuredQuestions: Question[] = [
  {
    id: '1',
    text: 'Why do we dream?',
    dhivehiText: 'އަހަރެމެންނަށް ހުވަފެން ފެންނަނީ ކީއްވެ؟',
    category: 'Psychology',
    icon: Brain,
    answers: 142,
  },
  {
    id: '2',
    text: 'Why is the ocean salty?',
    dhivehiText: 'ކަނޑުގެ ލޮނުގަނޑު ލޮނުވަނީ ކީއްވެ؟',
    category: 'Earth Science',
    icon: Globe,
    answers: 89,
  },
  {
    id: '3',
    text: 'Why does time feel faster as we age?',
    dhivehiText: 'އުމުރުން ދުވަސްވީ ވަރަކަށް ވަގުތު އަވަސްވާހެން ހީވަނީ ކީއްވެ؟',
    category: 'Philosophy',
    icon: Compass,
    answers: 215,
  },
  {
    id: '4',
    text: 'Why do stars twinkle?',
    dhivehiText: 'ތަރިތައް ވިދަނީ ކީއްވެ؟',
    category: 'Astronomy',
    icon: Sparkles,
    answers: 304,
  },
  {
    id: '5',
    text: 'Why do we yawn when others do?',
    dhivehiText: 'އެހެން މީހުން އާފުރޭއިރު އަހަރެމެން އާފުރެނީ ކީއްވެ؟',
    category: 'Biology',
    icon: Microscope,
    answers: 56,
  },
  {
    id: '6',
    text: 'Why is glass transparent?',
    dhivehiText: 'ބިއްލޫރި ފެންނަން ހުންނަނީ ކީއްވެ؟',
    category: 'Physics',
    icon: Lightbulb,
    answers: 112,
  },
];

export const categories = [
  'All',
  'Science',
  'Philosophy',
  'History',
  'Technology',
  'Nature',
  'Everyday Life',
];
