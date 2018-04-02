## 食用方法

```javascript
          <DateRange
            onChange={this.handleRangeChange.bind(this, 'dateRange')}
            moveRangeOnFirstSelection={false}
            ranges={[
              {
                startDate: this.state.dateRange.selection.startDate,
                endDate: this.state.dateRange.selection.endDate,
                key: 'selection',
              },
            ]}
            badges={[
              {
                date: '2018-04-18',
                count: 6,
              },
              {
                date: '2018-04-19',
                count: 9,
              },
            ]}
            className={'PreviewArea'}
          />

```
