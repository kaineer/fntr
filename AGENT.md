## React
 * Типы и интерфейсы
   * Предпочитай, где возможно, interface вместо type
 * Компоненты
   * Создавай компоненты в виде `export const ComponentName = (...) => ...`
   * Все классы выносим в .module.css
 * Слайсы
   * Из файла со слайсом экспортируй только сам слайс. 
   * Селекторы для слайса создавай внутри createSlice({ selectors: ... }). 
   * Селекторы слайса получай через const { selectorName } = sliceName.selectors;
   * Экшны слайса получай через const { actionName } = sliceName.actions;

