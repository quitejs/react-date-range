import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { rangeShape } from './DayCell.js';
import Month from './Month.js';
import { calcFocusDate, generateStyles, getMonthDisplayRange } from './utils';
import classnames from 'classnames';
import ReactList from 'react-list';
import {
  addMonths,
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addYears,
  setYear,
  setMonth,
  differenceInCalendarMonths,
  startOfMonth,
  endOfMonth,
  addDays,
  isSameMonth,
  differenceInDays,
  min,
  max,
} from 'date-fns';
import defaultLocale from 'date-fns/locale/en-US';
import coreStyles from './styles';

class Calendar extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.changeShownDate = this.changeShownDate.bind(this);
    this.focusToDate = this.focusToDate.bind(this);
    this.updateShownDate = this.updateShownDate.bind(this);
    this.handleRangeFocusChange = this.handleRangeFocusChange.bind(this);
    this.renderDateDisplay = this.renderDateDisplay.bind(this);
    this.onDragSelectionStart = this.onDragSelectionStart.bind(this);
    this.onDragSelectionEnd = this.onDragSelectionEnd.bind(this);
    this.onDragSelectionMove = this.onDragSelectionMove.bind(this);
    this.renderMonthAndYear = this.renderMonthAndYear.bind(this);
    this.dateOptions = { locale: props.locale };
    this.styles = generateStyles([coreStyles, props.classNames]);
    this.listSizeCache = {};
    this.state = {
      focusedDate: calcFocusDate(null, props),
      drag: {
        status: false,
        range: { startDate: null, endDate: null },
        disablePreview: false,
      },
      scrollArea: this.calcScrollArea(props),
    };
  }
  calcScrollArea(props) {
    const { direction, months, scroll } = props;
    if (!scroll.enabled) return { enabled: false };

    const longMonthHeight = scroll.longMonthHeight || scroll.monthHeight;
    if (direction === 'vertical') {
      return {
        enabled: true,
        monthHeight: scroll.monthHeight || 220,
        longMonthHeight: longMonthHeight || 240,
        calendarWidth: 'auto',
        calendarHeight: (scroll.calendarHeight || longMonthHeight || 240) * months,
      };
    }
    return {
      enabled: true,
      monthWidth: scroll.monthWidth || 332,
      calendarWidth: (scroll.calendarWidth || scroll.monthWidth || 332) * months,
      monthHeight: longMonthHeight || 300,
      calendarHeight: longMonthHeight || 300,
    };
  }
  focusToDate(date, props = this.props, preventUnnecessary = true) {
    if (!props.scroll.enabled) {
      this.setState({ focusedDate: date });
      return;
    }
    const targetMonthIndex = differenceInCalendarMonths(date, props.minDate, this.dateOptions);
    const visibleMonths = this.list.getVisibleRange();
    if (preventUnnecessary && visibleMonths.includes(targetMonthIndex)) return;
    this.list.scrollTo(targetMonthIndex);
    this.setState({ focusedDate: date });
  }
  updateShownDate(props = this.props) {
    const newProps = props.scroll.enabled
      ? {
          ...props,
          months: this.list.getVisibleRange().length,
        }
      : props;
    const newFocus = calcFocusDate(this.state.focusedDate, newProps);
    this.focusToDate(newFocus, newProps);
  }
  componentDidMount() {
    if (this.props.scroll.enabled) {
      // prevent react-list's initial render focus problem
      setTimeout(this.updateShownDate, 1);
    }
  }
  componentWillReceiveProps(nextProps) {
    const propMapper = {
      dateRange: 'ranges',
      date: 'date',
    };
    const targetProp = propMapper[nextProps.displayMode];
    if (this.props.locale !== nextProps.locale) {
      this.dateOptions = { locale: nextProps.locale };
    }
    if (JSON.stringify(this.props.scroll) !== JSON.stringify(nextProps.scroll)) {
      this.setState({ scrollArea: this.calcScrollArea(nextProps) });
    }
    if (nextProps[targetProp] !== this.props[targetProp]) {
      this.updateShownDate(nextProps);
    }
  }
  changeShownDate(value, mode = 'set') {
    const focusedDate = this.state.focusedDate;
    const modeMapper = {
      monthOffset: () => addMonths(focusedDate, value),
      setMonth: () => setMonth(focusedDate, value),
      setYear: () => setYear(focusedDate, value),
      set: () => value,
    };
    const newDate = min([max([modeMapper[mode](), this.props.minDate]), this.props.maxDate]);
    this.focusToDate(newDate, this.props, false);
  }
  handleRangeFocusChange(rangesIndex, rangeItemIndex) {
    this.props.onRangeFocusChange && this.props.onRangeFocusChange([rangesIndex, rangeItemIndex]);
  }
  renderMonthAndYear(focusedDate, changeShownDate, props) {
    const { showMonthArrow, locale, minDate, maxDate } = props;
    const upperYearLimit = maxDate.getFullYear();
    const lowerYearLimit = minDate.getFullYear();
    const styles = this.styles;
    return (
      <div className={styles.monthAndYearWrapper}>
        {showMonthArrow ? (
          <button
            type="button"
            className={classnames(styles.nextPrevButton, styles.prevButton)}
            onClick={() => changeShownDate(-1, 'monthOffset')}>
            <i />
          </button>
        ) : null}
        <span className={styles.monthAndYearPickers}>
          <span className={styles.monthPicker}>
            <select
              value={focusedDate.getMonth()}
              onChange={e => changeShownDate(e.target.value, 'setMonth')}>
              {locale.localize.months().map((month, i) => (
                <option key={i} value={i}>
                  {month}
                </option>
              ))}
            </select>
          </span>
          <span className={styles.monthAndYearDivider} />
          <span className={styles.yearPicker}>
            <select
              value={focusedDate.getFullYear()}
              onChange={e => changeShownDate(e.target.value, 'setYear')}>
              {new Array(upperYearLimit - lowerYearLimit + 1).fill(upperYearLimit).map((val, i) => {
                const year = val - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </span>
        </span>
        {showMonthArrow ? (
          <button
            type="button"
            className={classnames(styles.nextPrevButton, styles.nextButton)}
            onClick={() => changeShownDate(+1, 'monthOffset')}>
            <i />
          </button>
        ) : null}
      </div>
    );
  }
  renderWeekdays() {
    const now = new Date();
    return (
      <div className={this.styles.weekDays}>
        {eachDayOfInterval({
          start: startOfWeek(now, this.dateOptions),
          end: endOfWeek(now, this.dateOptions),
        }).map((day, i) => (
          <span className={this.styles.weekDay} key={i}>
            {format(day, 'ddd', this.dateOptions)}
          </span>
        ))}
      </div>
    );
  }
  renderDateDisplay() {
    const { focusedRange, color, ranges } = this.props;
    const styles = this.styles;
    return (
      <div className={styles.dateDisplayWrapper}>
        {ranges.map((range, i) => {
          if (range.showDateDisplay === false || (range.disabled && !range.showDateDisplay))
            return null;
          return (
            <div className={styles.dateDisplay} key={i} style={{ color: range.color || color }}>
              <span
                className={classnames(styles.dateDisplayItem, {
                  [styles.dateDisplayItemActive]: focusedRange[0] === i && focusedRange[1] === 0,
                })}
                onFocus={() => this.handleRangeFocusChange(i, 0)}>
                <input
                  disabled={range.disabled}
                  readOnly
                  value={this.formatDateDisplay(range.startDate, 'Early')}
                />
              </span>
              <span
                className={classnames(styles.dateDisplayItem, {
                  [styles.dateDisplayItemActive]: focusedRange[0] === i && focusedRange[1] === 1,
                })}
                onFocus={() => this.handleRangeFocusChange(i, 1)}>
                <input
                  disabled={range.disabled}
                  readOnly
                  value={this.formatDateDisplay(range.endDate, 'Continuous')}
                />
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  onDragSelectionStart(date) {
    this.setState({
      drag: {
        status: true,
        range: { startDate: date, endDate: date },
        disablePreview: true,
      },
    });
  }
  onDragSelectionEnd(date) {
    const { updateRange, displayMode, onChange } = this.props;
    if (displayMode === 'date' || !this.state.drag.status) {
      onChange && onChange(date);
      return;
    }
    const newRange = {
      startDate: this.state.drag.range.startDate,
      endDate: date,
    };
    if (displayMode !== 'dateRange' || isSameDay(newRange.startDate, date)) {
      this.setState({ drag: { status: false, range: {} } }, () => onChange && onChange(date));
    } else {
      this.setState({ drag: { status: false, range: {} } }, () => {
        updateRange && updateRange(newRange);
      });
    }
  }
  onDragSelectionMove(date) {
    const { drag } = this.state;
    if (!drag.status) return;
    this.setState({
      drag: {
        status: drag.status,
        range: { startDate: drag.range.startDate, endDate: date },
        disablePreview: true,
      },
    });
  }

  formatDateDisplay(date, defaultText) {
    if (!date) return defaultText;
    return format(date, this.props.dateDisplayFormat, this.dateOptions);
  }
  render() {
    const { showDateDisplay, onPreviewChange, scroll, direction, maxDate, minDate } = this.props;
    const { scrollArea, focusedDate } = this.state;
    const isVertical = direction === 'vertical';
    const navigatorRenderer = this.props.navigatorRenderer || this.renderMonthAndYear;
    return (
      <div
        className={classnames(this.styles.calendarWrapper, this.props.className)}
        onMouseUp={() => this.setState({ drag: { status: false, range: {} } })}
        onMouseLeave={() => {
          this.setState({ drag: { status: false, range: {} } });
        }}>
        {showDateDisplay && this.renderDateDisplay()}
        {navigatorRenderer(focusedDate, this.changeShownDate, this.props)}
        {scroll.enabled ? (
          <div>
            {isVertical && this.renderWeekdays(this.dateOptions)}
            <div
              className={classnames(
                this.styles.infiniteMonths,
                isVertical ? this.styles.monthsVertical : this.styles.monthsHorizontal
              )}
              onMouseLeave={() => onPreviewChange && onPreviewChange()}
              style={{
                width: scrollArea.calendarWidth + 11,
                height: scrollArea.calendarHeight + 11,
              }}
              onScroll={() => {
                const visibleMonths = this.list.getVisibleRange();
                // prevent scroll jump with wrong visible value
                if (visibleMonths[0] === undefined) return;
                const visibleMonth = addMonths(minDate, visibleMonths[0] || 0);
                const isFocusedToDifferent = !isSameMonth(visibleMonth, focusedDate);
                if (isFocusedToDifferent) this.setState({ focusedDate: visibleMonth });
              }}>
              <ReactList
                length={differenceInCalendarMonths(
                  endOfMonth(maxDate),
                  addDays(startOfMonth(minDate), -1),
                  this.dateOptions
                )}
                treshold={500}
                type="variable"
                ref={target => (this.list = target)}
                itemSizeEstimator={(index, cache) => {
                  this.listSizeCache = cache;
                  if (cache[index]) return cache[index];
                  if (!isVertical) return scrollArea.monthWidth;
                  const monthStep = addMonths(minDate, index);
                  const { start, end } = getMonthDisplayRange(monthStep, this.dateOptions);
                  const isLongMonth = differenceInDays(end, start, this.dateOptions) + 1 > 7 * 5;
                  return isLongMonth ? scrollArea.longMonthHeight : scrollArea.monthHeight;
                }}
                axis={isVertical ? 'y' : 'x'}
                itemRenderer={(index, key) => {
                  const monthStep = addMonths(minDate, index);
                  return (
                    <Month
                      {...this.props}
                      key={key}
                      drag={this.state.drag}
                      dateOptions={this.dateOptions}
                      month={monthStep}
                      onDragSelectionStart={this.onDragSelectionStart}
                      onDragSelectionEnd={this.onDragSelectionEnd}
                      onDragSelectionMove={this.onDragSelectionMove}
                      onMouseLeave={() => onPreviewChange && onPreviewChange()}
                      styles={this.styles}
                      style={
                        isVertical
                          ? {}
                          : { height: scrollArea.monthHeight, width: scrollArea.monthWidth }
                      }
                      showMonthName
                      showWeekDays={!isVertical}
                    />
                  );
                }}
              />
            </div>
          </div>
        ) : (
          <div
            className={classnames(
              this.styles.months,
              isVertical ? this.styles.monthsVertical : this.styles.monthsHorizontal
            )}>
            {new Array(this.props.months).fill(null).map((_, i) => {
              const monthStep = addMonths(this.state.focusedDate, i);
              return (
                <Month
                  {...this.props}
                  key={i}
                  drag={this.state.drag}
                  dateOptions={this.dateOptions}
                  month={monthStep}
                  onDragSelectionStart={this.onDragSelectionStart}
                  onDragSelectionEnd={this.onDragSelectionEnd}
                  onDragSelectionMove={this.onDragSelectionMove}
                  onMouseLeave={() => onPreviewChange && onPreviewChange()}
                  styles={this.styles}
                  showWeekDays={!isVertical || i === 0}
                  showMonthName={!isVertical || i > 0}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

Calendar.defaultProps = {
  showMonthArrow: true,
  classNames: {},
  specialDays: [],
  locale: defaultLocale,
  ranges: [],
  focusedRange: [0, 0],
  dateDisplayFormat: 'MMM D,YYYY',
  monthDisplayFormat: 'MMM YYYY',
  showDateDisplay: true,
  showSelectionPreview: true,
  displayMode: 'date',
  months: 1,
  color: '#3d91ff',
  scroll: {
    enabled: false,
  },
  direction: 'vertical',
  maxDate: addYears(new Date(), 20),
  minDate: addYears(new Date(), -100),
};

Calendar.propTypes = {
  showMonthArrow: PropTypes.bool,
  minDate: PropTypes.object,
  maxDate: PropTypes.object,
  date: PropTypes.object,
  onChange: PropTypes.func,
  onPreviewChange: PropTypes.func,
  onRangeFocusChange: PropTypes.func,
  specialDays: PropTypes.array,
  classNames: PropTypes.object,
  locale: PropTypes.object,
  shownDate: PropTypes.object,
  ranges: PropTypes.arrayOf(rangeShape),
  preview: PropTypes.shape({
    startDate: PropTypes.object,
    endDate: PropTypes.object,
  }),
  previewColor: PropTypes.string,
  dateDisplayFormat: PropTypes.string,
  monthDisplayFormat: PropTypes.string,
  focusedRange: PropTypes.arrayOf(PropTypes.number),
  months: PropTypes.number,
  className: PropTypes.string,
  showDateDisplay: PropTypes.bool,
  showSelectionPreview: PropTypes.bool,
  displayMode: PropTypes.oneOf(['dateRange', 'date']),
  color: PropTypes.string,
  updateRange: PropTypes.func,
  scroll: PropTypes.shape({
    enabled: PropTypes.bool,
    monthHeight: PropTypes.number,
    longMonthHeight: PropTypes.number,
    monthWidth: PropTypes.number,
    calendarWidth: PropTypes.number,
    calendarHeight: PropTypes.number,
  }),
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
  navigatorRenderer: PropTypes.func,
  badges: PropTypes.array,
};

export default Calendar;
