import { useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Calculator, Ruler, RotateCw, Home, Info, Plus, X, Globe } from 'lucide-react';
import heroImage from 'figma:asset/dcbfaa3f4bc6a07ea6143e64e40c46bd7c31006d.png';

type Language = 'ru' | 'en';

const translations = {
  ru: {
    // Header
    title: 'Калькулятор обоев',
    subtitle: 'Doma Professional',
    calculation: 'Точный расчет',
    materials: 'материалов',
    
    // Hero
    heroTitle: 'Профессиональный расчет обоев',
    heroSubtitle: 'Точно рассчитайте необходимое количество рулонов с учетом шага рисунка и особенностей помещения',
    
    // Roll parameters
    rollParameters: 'Параметры рулона',
    rollWidth: 'Ширина рулона',
    rollLength: 'Длина рулона',
    patternRepeat: 'Шаг рисунка',
    noPattern: 'без шага',
    
    // Room dimensions
    roomDimensions: 'Размеры комнаты',
    roomPerimeter: 'Периметр комнаты',
    roomHeight: 'Высота помещения',
    wallArea: 'Площадь стен',
    windowsAndDoors: 'Окна и двери',
    effectiveArea: 'Площадь для оклейки',
    
    // Windows and Doors
    windows: 'Окна',
    addWindow: 'Добавить окно',
    window: 'Окно',
    noWindows: 'Окна не добавлены',
    doors: 'Двери',
    addDoor: 'Добавить дверь',
    door: 'Дверь',
    noDoors: 'Двери не добавлены',
    width: 'Ширина',
    height: 'Высота',
    
    // Results
    rollsNeeded: 'Необходимо рулонов',
    withMargin: 'с запасом 10%',
    withoutMargin: 'Без запаса',
    waste: 'Отходы',
    calculationDetails: 'Детали расчета',
    stripsPerRoll: 'Полос из рулона',
    totalStrips: 'Всего полос',
    coverageArea: 'Площадь покрытия',
    pieces: 'шт',
    
    // Info
    recommendations: 'Рекомендации специалистов Doma',
    recommendationText: 'Рекомендуется всегда покупать на 1-2 рулона больше расчетного количества для возможных ошибок при поклейке и будущего ремонта.',
    patternWarning: ' При наличии шага рисунка отходы увеличиваются на 15-20%.',
    tip1: '• Учитывайте двери и окна',
    tip2: '• Проверяйте партию рулонов',
    tip3: '• Храните остатки',
  },
  en: {
    // Header
    title: 'Wallpaper Calculator',
    subtitle: 'Doma Professional',
    calculation: 'Precise calculation',
    materials: 'of materials',
    
    // Hero
    heroTitle: 'Professional Wallpaper Calculator',
    heroSubtitle: 'Accurately calculate the required number of rolls considering pattern repeat and room specifications',
    
    // Roll parameters
    rollParameters: 'Roll Parameters',
    rollWidth: 'Roll Width',
    rollLength: 'Roll Length',
    patternRepeat: 'Pattern Repeat',
    noPattern: 'no repeat',
    
    // Room dimensions
    roomDimensions: 'Room Dimensions',
    roomPerimeter: 'Room Perimeter',
    roomHeight: 'Room Height',
    wallArea: 'Wall Area',
    windowsAndDoors: 'Windows & Doors',
    effectiveArea: 'Coverage Area',
    
    // Windows and Doors
    windows: 'Windows',
    addWindow: 'Add Window',
    window: 'Window',
    noWindows: 'No windows added',
    doors: 'Doors',
    addDoor: 'Add Door',
    door: 'Door',
    noDoors: 'No doors added',
    width: 'Width',
    height: 'Height',
    
    // Results
    rollsNeeded: 'Rolls Required',
    withMargin: 'with 10% margin',
    withoutMargin: 'No margin',
    waste: 'Waste',
    calculationDetails: 'Calculation Details',
    stripsPerRoll: 'Strips per roll',
    totalStrips: 'Total strips',
    coverageArea: 'Coverage area',
    pieces: 'pcs',
    
    // Info
    recommendations: 'Doma Expert Recommendations',
    recommendationText: 'It is always recommended to buy 1-2 rolls more than calculated for possible installation errors and future repairs.',
    patternWarning: ' With pattern repeat, waste increases by 15-20%.',
    tip1: '• Account for doors & windows',
    tip2: '• Check roll batch numbers',
    tip3: '• Keep leftover rolls',
  },
};

interface CalculatorState {
  rollWidth: number; // см
  rollLength: number; // м
  patternRepeat: number; // см
  roomPerimeter: number; // м
  roomHeight: number; // м
}

export function WallpaperCalculator() {
  const [language, setLanguage] = useState<Language>('ru');
  const t = translations[language];

  const [values, setValues] = useState<CalculatorState>({
    rollWidth: 53,
    rollLength: 10,
    patternRepeat: 0,
    roomPerimeter: 16,
    roomHeight: 2.7,
  });

  const [results, setResults] = useState({
    stripsPerRoll: 0,
    totalStripsNeeded: 0,
    rollsNeeded: 0,
    rollsWithMargin: 0,
    wastePercentage: 0,
    wallArea: 0,
    windowsDoorsArea: 0,
    effectiveArea: 0,
  });

  const [windows, setWindows] = useState<{ id: number, width: number, height: number }[]>([]);
  const [nextWindowId, setNextWindowId] = useState(1);

  const [doors, setDoors] = useState<{ id: number, width: number, height: number }[]>([]);
  const [nextDoorId, setNextDoorId] = useState(1);

  useEffect(() => {
    calculateWallpaper();
  }, [values, windows, doors]);

  // Send height to parent window for iframe auto-resize
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      if (window.parent !== window) {
        window.parent.postMessage({ height }, '*');
      }
    };

    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [values, windows, doors, language]);

  const calculateWallpaper = () => {
    const { rollWidth, rollLength, patternRepeat, roomPerimeter, roomHeight } = values;

    // Площадь стен
    const wallArea = roomPerimeter * roomHeight;

    // Площадь окон и дверей
    const windowsArea = windows.reduce((sum, w) => sum + (w.width * w.height), 0);
    const doorsArea = doors.reduce((sum, d) => sum + (d.width * d.height), 0);
    const windowsDoorsArea = windowsArea + doorsArea;

    // Эффективная площадь для оклейки
    const effectiveArea = Math.max(wallArea - windowsDoorsArea, 0);

    // Расчет высоты полосы с учетом шага рисунка
    const stripHeight = patternRepeat > 0 
      ? Math.ceil(roomHeight / (patternRepeat / 100)) * (patternRepeat / 100)
      : roomHeight;

    // Количество полос из одного рулона
    const stripsPerRoll = Math.floor((rollLength * 100) / (stripHeight * 100));

    // Общее количество полос (на основе периметра минус ширина окон и дверей)
    const effectivePerimeter = roomPerimeter - windows.reduce((sum, w) => sum + w.width, 0) - doors.reduce((sum, d) => sum + d.width, 0);
    const totalStripsNeeded = Math.ceil((Math.max(effectivePerimeter, 0) * 100) / rollWidth);

    // Необходимое количество рулонов
    const rollsNeeded = Math.ceil(totalStripsNeeded / stripsPerRoll);

    // С запасом 10%
    const rollsWithMargin = Math.ceil(rollsNeeded * 1.1);

    // Процент отходов
    const totalUsed = totalStripsNeeded * stripHeight;
    const totalAvailable = rollsWithMargin * rollLength;
    const wastePercentage = totalAvailable > 0 ? ((totalAvailable - totalUsed) / totalAvailable) * 100 : 0;

    setResults({
      stripsPerRoll,
      totalStripsNeeded,
      rollsNeeded,
      rollsWithMargin,
      wastePercentage,
      wallArea,
      windowsDoorsArea,
      effectiveArea,
    });
  };

  const updateValue = (key: keyof CalculatorState, value: number) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const addWindow = () => {
    setWindows([...windows, { id: nextWindowId, width: 1.2, height: 1.5 }]);
    setNextWindowId(nextWindowId + 1);
  };

  const removeWindow = (id: number) => {
    setWindows(windows.filter(w => w.id !== id));
  };

  const updateWindow = (id: number, field: 'width' | 'height', value: number) => {
    setWindows(windows.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const addDoor = () => {
    setDoors([...doors, { id: nextDoorId, width: 0.8, height: 2 }]);
    setNextDoorId(nextDoorId + 1);
  };

  const removeDoor = (id: number) => {
    setDoors(doors.filter(d => d.id !== id));
  };

  const updateDoor = (id: number, field: 'width' | 'height', value: number) => {
    setDoors(doors.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] text-[#2c2c2c]">
      {/* Header */}
      <div className="border-b border-[#e5e0d8] bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8b7355] rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-[#2c2c2c]">{t.title}</h1>
                <p className="text-sm text-[#7a7269]">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-[#7a7269]">{t.calculation}</p>
                <p className="text-sm text-[#8b7355]">{t.materials}</p>
              </div>
              <Button
                onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
                variant="outline"
                size="sm"
                className="h-10 px-3 border-[#8b7355] text-[#8b7355] hover:bg-[#8b7355] hover:text-white gap-2"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{language === 'ru' ? 'EN' : 'RU'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage}
            alt="Wallpaper Rolls"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/90 via-[#1a1a1a]/85 to-[#f8f6f3]"></div>
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#8b7355] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl text-white mb-3">{t.heroTitle}</h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              {t.heroSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Roll Dimensions */}
          <Card className="bg-white border-[#e5e0d8] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-[#8b7355] to-[#a68968] p-4">
              <div className="flex items-center gap-3">
                <RotateCw className="w-5 h-5 text-white" />
                <h2 className="text-white">{t.rollParameters}</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Roll Width */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rollWidth" className="text-[#5a5248]">{t.rollWidth}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="rollWidth"
                      type="number"
                      value={values.rollWidth}
                      onChange={(e) => updateValue('rollWidth', Number(e.target.value))}
                      className="w-20 h-9 text-right bg-[#f8f6f3] border-[#e5e0d8] text-[#2c2c2c] rounded-lg"
                    />
                    <span className="text-sm text-[#7a7269] w-8">cm</span>
                  </div>
                </div>
                <Slider
                  value={[values.rollWidth]}
                  onValueChange={(val) => updateValue('rollWidth', val[0])}
                  min={50}
                  max={120}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#9a8f82]">
                  <span>50 cm</span>
                  <span>120 cm</span>
                </div>
              </div>

              {/* Roll Length */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rollLength" className="text-[#5a5248]">{t.rollLength}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="rollLength"
                      type="number"
                      value={values.rollLength}
                      onChange={(e) => updateValue('rollLength', Number(e.target.value))}
                      className="w-20 h-9 text-right bg-[#f8f6f3] border-[#e5e0d8] text-[#2c2c2c] rounded-lg"
                      step="0.1"
                    />
                    <span className="text-sm text-[#7a7269] w-8">m</span>
                  </div>
                </div>
                <Slider
                  value={[values.rollLength]}
                  onValueChange={(val) => updateValue('rollLength', val[0])}
                  min={5}
                  max={25}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#9a8f82]">
                  <span>5 m</span>
                  <span>25 m</span>
                </div>
              </div>

              {/* Pattern Repeat */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="patternRepeat" className="text-[#5a5248]">{t.patternRepeat}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="patternRepeat"
                      type="number"
                      value={values.patternRepeat}
                      onChange={(e) => updateValue('patternRepeat', Number(e.target.value))}
                      className="w-20 h-9 text-right bg-[#f8f6f3] border-[#e5e0d8] text-[#2c2c2c] rounded-lg"
                    />
                    <span className="text-sm text-[#7a7269] w-8">cm</span>
                  </div>
                </div>
                <Slider
                  value={[values.patternRepeat]}
                  onValueChange={(val) => updateValue('patternRepeat', val[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#9a8f82]">
                  <span>0 cm ({t.noPattern})</span>
                  <span>100 cm</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Room Dimensions */}
          <Card className="bg-white border-[#e5e0d8] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-[#6b5d4f] to-[#8b7355] p-4 border-b border-[#e5e0d8]">
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-white" />
                <h2 className="text-white">{t.roomDimensions}</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Room Perimeter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="roomPerimeter" className="text-[#5a5248]">{t.roomPerimeter}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="roomPerimeter"
                      type="number"
                      value={values.roomPerimeter}
                      onChange={(e) => updateValue('roomPerimeter', Number(e.target.value))}
                      className="w-20 h-9 text-right bg-[#f8f6f3] border-[#e5e0d8] text-[#2c2c2c] rounded-lg"
                      step="0.1"
                    />
                    <span className="text-sm text-[#7a7269] w-8">m</span>
                  </div>
                </div>
                <Slider
                  value={[values.roomPerimeter]}
                  onValueChange={(val) => updateValue('roomPerimeter', val[0])}
                  min={4}
                  max={40}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#9a8f82]">
                  <span>4 m</span>
                  <span>40 m</span>
                </div>
              </div>

              {/* Room Height */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="roomHeight" className="text-[#5a5248]">{t.roomHeight}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="roomHeight"
                      type="number"
                      value={values.roomHeight}
                      onChange={(e) => updateValue('roomHeight', Number(e.target.value))}
                      className="w-20 h-9 text-right bg-[#f8f6f3] border-[#e5e0d8] text-[#2c2c2c] rounded-lg"
                      step="0.1"
                    />
                    <span className="text-sm text-[#7a7269] w-8">m</span>
                  </div>
                </div>
                <Slider
                  value={[values.roomHeight]}
                  onValueChange={(val) => updateValue('roomHeight', val[0])}
                  min={2}
                  max={4}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#9a8f82]">
                  <span>2 m</span>
                  <span>4 m</span>
                </div>
              </div>

              {/* Visual representation */}
              <div className="mt-8 p-4 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#7a7269]">{t.wallArea}</span>
                  <span className="text-[#2c2c2c]">
                    {results.wallArea.toFixed(2)} m²
                  </span>
                </div>
                {(windows.length > 0 || doors.length > 0) && (
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#7a7269]">{t.windowsAndDoors}</span>
                    <span className="text-[#8b7355]">
                      -{results.windowsDoorsArea.toFixed(2)} m²
                    </span>
                  </div>
                )}
                <Separator className="bg-[#e5e0d8] my-2" />
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#5a5248]">{t.effectiveArea}</span>
                  <span className="text-[#2c2c2c]">
                    {results.effectiveArea.toFixed(2)} m²
                  </span>
                </div>
                <div className="h-2 bg-[#e5e0d8] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#8b7355] to-[#a68968] transition-all duration-300"
                    style={{ width: `${Math.min((results.effectiveArea / 100 * 100), 100)}%` }}
                  />
                </div>
              </div>

              {/* Windows Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[#5a5248]">{t.windows}</Label>
                  <Button 
                    onClick={addWindow}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-[#8b7355] text-[#8b7355] hover:bg-[#8b7355] hover:text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t.addWindow}
                  </Button>
                </div>
                
                {windows.length === 0 ? (
                  <p className="text-xs text-[#9a8f82] text-center py-2">{t.noWindows}</p>
                ) : (
                  <div className="space-y-3">
                    {windows.map((window, index) => (
                      <div key={window.id} className="p-3 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#7a7269]">{t.window} {index + 1}</span>
                          <Button
                            onClick={() => removeWindow(window.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-[#e5e0d8]"
                          >
                            <X className="w-3 h-3 text-[#7a7269]" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`window-width-${window.id}`} className="text-xs text-[#7a7269]">{t.width} (m)</Label>
                            <Input
                              id={`window-width-${window.id}`}
                              type="number"
                              value={window.width}
                              onChange={(e) => updateWindow(window.id, 'width', Number(e.target.value))}
                              className="h-8 text-sm bg-white border-[#e5e0d8] text-[#2c2c2c] rounded mt-1"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`window-height-${window.id}`} className="text-xs text-[#7a7269]">{t.height} (m)</Label>
                            <Input
                              id={`window-height-${window.id}`}
                              type="number"
                              value={window.height}
                              onChange={(e) => updateWindow(window.id, 'height', Number(e.target.value))}
                              className="h-8 text-sm bg-white border-[#e5e0d8] text-[#2c2c2c] rounded mt-1"
                              step="0.1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doors Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[#5a5248]">{t.doors}</Label>
                  <Button 
                    onClick={addDoor}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-[#8b7355] text-[#8b7355] hover:bg-[#8b7355] hover:text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t.addDoor}
                  </Button>
                </div>
                
                {doors.length === 0 ? (
                  <p className="text-xs text-[#9a8f82] text-center py-2">{t.noDoors}</p>
                ) : (
                  <div className="space-y-3">
                    {doors.map((door, index) => (
                      <div key={door.id} className="p-3 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#7a7269]">{t.door} {index + 1}</span>
                          <Button
                            onClick={() => removeDoor(door.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-[#e5e0d8]"
                          >
                            <X className="w-3 h-3 text-[#7a7269]" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`door-width-${door.id}`} className="text-xs text-[#7a7269]">{t.width} (m)</Label>
                            <Input
                              id={`door-width-${door.id}`}
                              type="number"
                              value={door.width}
                              onChange={(e) => updateDoor(door.id, 'width', Number(e.target.value))}
                              className="h-8 text-sm bg-white border-[#e5e0d8] text-[#2c2c2c] rounded mt-1"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`door-height-${door.id}`} className="text-xs text-[#7a7269]">{t.height} (m)</Label>
                            <Input
                              id={`door-height-${door.id}`}
                              type="number"
                              value={door.height}
                              onChange={(e) => updateDoor(door.id, 'height', Number(e.target.value))}
                              className="h-8 text-sm bg-white border-[#e5e0d8] text-[#2c2c2c] rounded mt-1"
                              step="0.1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Results Section */}
          <Card className="bg-white border-[#e5e0d8] rounded-xl overflow-hidden lg:row-span-2 shadow-sm">
            <div className="bg-gradient-to-br from-[#8b7355] to-[#a68968] p-6">
              <div className="text-center">
                <p className="text-white/90 text-sm mb-2">{t.rollsNeeded}</p>
                <div className="text-7xl text-white mb-1">{results.rollsWithMargin}</div>
                <p className="text-sm text-white/80">{t.withMargin}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f8f6f3] p-4 rounded-lg border border-[#e5e0d8]">
                  <p className="text-xs text-[#7a7269] mb-1">{t.withoutMargin}</p>
                  <p className="text-3xl text-[#2c2c2c]">{results.rollsNeeded}</p>
                </div>
                <div className="bg-[#f8f6f3] p-4 rounded-lg border border-[#e5e0d8]">
                  <p className="text-xs text-[#7a7269] mb-1">{t.waste}</p>
                  <p className="text-3xl text-[#2c2c2c]">{results.wastePercentage.toFixed(1)}%</p>
                </div>
              </div>

              <Separator className="bg-[#e5e0d8]" />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="w-4 h-4 text-[#8b7355]" />
                  <h3 className="text-[#2c2c2c]">{t.calculationDetails}</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                    <span className="text-sm text-[#7a7269]">{t.stripsPerRoll}</span>
                    <span className="text-[#2c2c2c]">{results.stripsPerRoll} {t.pieces}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                    <span className="text-sm text-[#7a7269]">{t.totalStrips}</span>
                    <span className="text-[#2c2c2c]">{results.totalStripsNeeded} {t.pieces}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                    <span className="text-sm text-[#7a7269]">{t.wallArea}</span>
                    <span className="text-[#2c2c2c]">
                      {results.wallArea.toFixed(2)} m²
                    </span>
                  </div>
                  {results.windowsDoorsArea > 0 && (
                    <div className="flex items-center justify-between p-3 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                      <span className="text-sm text-[#7a7269]">{t.windowsAndDoors}</span>
                      <span className="text-[#8b7355]">
                        -{results.windowsDoorsArea.toFixed(2)} m²
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                    <span className="text-sm text-[#7a7269]">{t.effectiveArea}</span>
                    <span className="text-[#2c2c2c]">
                      {results.effectiveArea.toFixed(2)} m²
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#f8f6f3] rounded-lg border border-[#e5e0d8]">
                    <span className="text-sm text-[#7a7269]">{t.coverageArea}</span>
                    <span className="text-[#2c2c2c]">
                      {((values.rollWidth / 100) * values.rollLength * results.rollsWithMargin).toFixed(2)} m²
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-[#faf9f7] to-[#f5f3ef] border-[#e5e0d8] rounded-xl lg:col-span-2 shadow-sm">
            <div className="p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#e5e0d8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-[#8b7355]" />
                </div>
                <div>
                  <h3 className="text-[#2c2c2c] mb-2">{t.recommendations}</h3>
                  <p className="text-sm text-[#5a5248] leading-relaxed">
                    {t.recommendationText}
                    {values.patternRepeat > 0 && t.patternWarning}
                  </p>
                  <div className="mt-4 flex gap-4 text-xs text-[#7a7269]">
                    <span>{t.tip1}</span>
                    <span>{t.tip2}</span>
                    <span>{t.tip3}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}