import { translateNodeToRussian, translateToRussian } from './russian';

describe('Russian UI translations', () => {
  it('translates exact interface labels', () => {
    expect(translateToRussian('Search')).toBe('Поиск');
    expect(translateToRussian('Type a message...')).toBe('Введите сообщение…');
  });

  it('preserves whitespace used by composed text', () => {
    expect(translateToRussian(' Search ')).toBe(' Поиск ');
  });

  it('translates dynamic onboarding headings', () => {
    expect(translateToRussian('Step 2 of 5: Gender'))
      .toBe('Шаг 2 из 5: Пол');
  });

  it('leaves API values and user-generated text without a translation unchanged', () => {
    expect(translateToRussian('Ada Lovelace')).toBe('Ada Lovelace');
  });

  it('translates strings inside React child arrays', () => {
    expect(translateNodeToRussian(['Search', ' / ', 'Profile']))
      .toEqual(['Поиск', ' / ', 'Профиль']);
  });
});
