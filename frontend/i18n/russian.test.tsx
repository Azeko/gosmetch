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

  it.each([
    ['Refresh', 'Обновить'],
    ['Filters', 'Фильтры'],
    ['Feed', 'Лента'],
    ['Inbox', 'Сообщения'],
    ['Active Members', 'Активные участники'],
    ['Join or\u00a0sign\u00a0in', 'Зарегистрироваться или войти'],
    ['Guidelines', 'Правила'],
    ['Terms', 'Условия'],
    ['Privacy', 'Конфиденциальность'],
    [
      'No matches found. Try adjusting your search filters to include more people.',
      'Совпадений не найдено. Измените фильтры поиска, чтобы увидеть больше людей.',
    ],
  ])('covers the reported untranslated UI string %s', (english, russian) => {
    expect(translateToRussian(english)).toBe(russian);
  });
});
