import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KalendilyGame } from '@celeplay/game-kalendily';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';

export const KalendilyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setBgMusicVolume } = useAudio();

  React.useEffect(() => {
    setBgMusicVolume(0.2); // Lower music volume while playing
  }, [setBgMusicVolume]);

  const kalendilyQuestions = [
    {
      id: 'q1',
      text: 'Spot the day the Dangote Foundation was formally incorporated (renamed the Aliko Dangote Foundation in 2018) to manage his philanthropic initiatives.',
      answerText: 'MAY 6, 1994',
      explanation: 'The Dangote Foundation was formally incorporated on May 6, 1994, dedicating significant resources to philanthropic initiatives across Africa.',
      day: 6,
      month: 4, // 0-indexed (May)
      year: 1994,
      imageUrl: '/assets/dynamic/1b.webp'
    },
    {
      id: 'q2',
      text: 'Spot the day Dangote Cement PLC was officially listed on the daily official list of the Nigerian Stock Exchange (NGX).',
      answerText: 'OCTOBER 26, 2010',
      explanation: 'Dangote Cement PLC was officially listed on the Nigerian Stock Exchange on October 26, 2010, marking a massive milestone in its corporate history.',
      day: 26,
      month: 9, // Oct
      year: 2010,
      imageUrl: '/assets/dynamic/2b.webp'
    },
    {
      id: 'q3',
      text: 'Spot the day a personal endowment of $1.25 billion was formally made to the Aliko Dangote Foundation, significantly scaling up its capacity.',
      answerText: 'MARCH 5, 2014',
      explanation: 'On March 5, 2014, a massive $1.25 billion personal endowment was made to scale up health and nutrition initiatives.',
      day: 5,
      month: 2, // Mar
      year: 2014,
      imageUrl: '/assets/dynamic/3b.webp'
    },
    {
      id: 'q4',
      text: "Spot the day Aliko Dangote was officially crowned Africa's Richest Person for the first time with the release of the 25th annual Forbes World's Billionaires list.",
      answerText: 'MARCH 9, 2011',
      explanation: "He was officially crowned Africa's Richest Person for the first time on March 9, 2011.",
      day: 9,
      month: 2, // Mar
      year: 2011,
      imageUrl: '/assets/dynamic/4b.webp'
    },
    {
      id: 'q5',
      text: 'Spot the day Aliko Dangote was decorated with the Grand Commander of the Order of the Niger (GCON) national honor by President Goodluck Jonathan.',
      answerText: 'NOVEMBER 14, 2011',
      explanation: 'He was decorated with the GCON national honor on November 14, 2011, recognizing his immense contributions.',
      day: 14,
      month: 10, // Nov
      year: 2011,
      imageUrl: '/assets/dynamic/5b.webp'
    },
    {
      id: 'q6',
      text: 'Spot the day Aliko Dangote was born in Kano, Nigeria, into the prominent Dantata merchant family.',
      answerText: 'APRIL 10, 1957',
      explanation: 'Aliko Dangote was born on April 10, 1957, in Kano, Nigeria.',
      day: 10,
      month: 3, // Apr
      year: 1957,
      imageUrl: '/assets/dynamic/8b.webp'
    },
    {
      id: 'q7',
      text: 'Spot the day Dangote Petroleum Refinery in Lekki, Lagos, officially commissioned the 650,000 barrels-per-day by President Muhammadu Buhari.',
      answerText: 'MAY 22, 2023',
      explanation: 'The mega-refinery was officially commissioned on May 22, 2023.',
      day: 22,
      month: 4, // May
      year: 2023,
      imageUrl: '/assets/dynamic/6b.webp'
    },
    {
      id: 'q8',
      text: 'Spot the day Aliko Dangote officially unveiled the 3.3 billion dollar financing agreement and structural plans to build the Dangote Oil Refinery.',
      answerText: 'SEPTEMBER 4, 2013',
      explanation: 'The massive $3.3 billion financing agreement was officially unveiled on September 4, 2013.',
      day: 4,
      month: 8, // Sep
      year: 2013,
      imageUrl: '/assets/dynamic/7b.webp'
    },
    {
      id: 'q9',
      text: 'Spot the day Obajana Cement Plant in Kogi State was commissioned by President Olusegun Obasanjo.',
      answerText: 'MAY 12, 2007',
      explanation: 'The Obajana Cement Plant was commissioned on May 12, 2007.',
      day: 12,
      month: 4, // May
      year: 2007,
      imageUrl: '/assets/dynamic/1b.webp'
    },
    {
      id: 'q10',
      text: 'Spot the day he was selected for the global TIME 100 list of the Most Influential People in the World, recognized for his extensive industrial footprint.',
      answerText: 'APRIL 24, 2014',
      explanation: 'He was selected for the TIME 100 list on April 24, 2014.',
      day: 24,
      month: 3, // Apr
      year: 2014,
      imageUrl: '/assets/dynamic/2b.webp'
    }
  ];

  const handleGameEnd = (score: number, maxScore: number, timeTaken: number) => {
    console.log(`Kalendily Ended! Score: ${score}/${maxScore}, Time: ${timeTaken}s`);
    navigate('/leaderboard');
  };

  return (
    <KalendilyGame 
      themeLogoUrl={theme.logo_url}
      themeBannerUrl="/assets/dynamic/kalendilybanner.webp"
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      questions={kalendilyQuestions}
      onGameEnd={handleGameEnd}
      onExit={() => navigate('/games')}
    />
  );
};
