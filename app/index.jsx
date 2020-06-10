import React from 'react';
import ReactDOM from 'react-dom';
import Tabllist from '../src';
import './index.scss';

const Dev = () => {
  const checkboxEvent = function(a, b, c) {
    console.log(a, b, c);
  };

  const option = {
    data: [
      [
        {
          type: 'input',
          text: '1',
          defaultValue: '1st column',
          placeholder: '1st column'
        },
        {
          type: 'text',
          text: '2nd column'
        },
        '3rd column',
        {
          type: 'select',
          text: '4th column',
          data: 123,
          className: '',
          option: [
            {
              id: '1',
              label: 'Scroll to the 2nd row',
              value: 0
            },
            {
              id: '2',
              label: 'Scroll to the 5rd row',
              value: 1
            },
            {
              id: '3',
              label: 'Scroll to the 7rd row',
              value: 2
            }
          ],
          event: 'onChange',
          callback: (instance, objectUnit, event) => {
            // step 1: Get the value of select
            const { value } = event.target;
            // step 2: According to the value of select to match the value of the corresponding row in the data,
            // 				 and then get the index of the row
            const { scrollTo, renderData } = instance;
            for(let i = 0, k = renderData; i < k.length; i++) {
              // eslint-disable-next-line no-undef
              if(_.isPlainObject(renderData[i]) && parseInt(renderData[i].value) === parseInt(value)) {
                // step 3: Call method scrolling list
                scrollTo(i - 1);
                break;
              }
            }
          }
        }
      ],
      [
        <span key={0}>I am a span</span>,
        <div key={1} onClick={() => alert('test JSX event')}>test JSX event</div>,
        <a key={2} href='http://www.xieyangogo.cn/react-tabllist/'>I am a link</a>,
        <div key={3}>I am a div</div>
      ],
      {
        type: 'row',
        data: 1,
        value: 0,
        event: 'onClick',
        callback: (restData, objectUnit, event) => {
          alert('test event of row');
          console.log(restData, objectUnit, event);
        },
        className: 'click-row',
        cells: [
          'row 1; column 1',
          {
            type: 'link',
            text: 'I am a first link',
            className: 'test-link',
            callback: () => {console.log('I am a first link');}
          },
          {
            type: 'link',
            text: 'I am a second link',
            href: 'https://github.com/oceanxy/react-tabllist',
            className: 'test-link'
          },
          {
            type: 'button',
            value: 'click me',
            className: 'test-btn',
            callback: () => {
              alert('hello react-tabllist');
            }
          }
        ]
      },
      [
        {
          type: 'img',
          src: 'http://www.xieyangogo.cn/root/assets/img/web_github_128px.png',
          alt: '',
          text: 'row 2; column 1',
          key: '',
          value: '',
          style: {
            width: 24,
            height: 24
          }
        },
        {
          type: 'link',
          data: 10,
          text: 'I am a link, I use event and callback to implement custom functions',
          className: 'test-link2',
          key: '',
          event: 'onClick',
          callback: () => {
            window.open('https://github.com/oceanxy/react-tabllist');
          }
        },
        {
          type: 'link',
          text: 'I am a link',
          href: 'https://github.com/oceanxy/react-tabllist',
          className: 'test-link'
        },
        {
          type: 'button',
          value: 'click me',
          className: 'test-btn',
          event: 'onClick',
          callback: (data, cellObject, obj) => {
            obj.target.value = 'clicked';
          }
        }
      ],
      ['row 3; column 1', 'row 3; column 2', 'row 3; column 3', 'row 3; column 4'],
      {
        type: 'row',
        data: 1,
        value: 1,
        event: 'onClick',
        callback: (restData, objectUnit, event) => {
          alert('test event of row');
          console.log(restData, objectUnit, event);
        },
        className: 'click-row',
        cells: [
          {
            type: 'link',
            text: 'I am a link',
            href: 'https://github.com/oceanxy/react-tabllist',
            className: 'test-link'
          },
          {
            type: 'button',
            value: 'click me',
            className: 'test-btn',
            callback: () => {
              alert('hello react-tabllist');
            }
          },
          'row 4; column 3',
          'row 4; column 4'
        ]
      },
      [
        [
          {
            type: 'radio',
            name: 'group1',
            text: 'row 5; column 1-1',
            value: 0,
            className: 'test-radio',
            callback: checkboxEvent
          },
          {
            type: 'radio',
            name: 'group1',
            text: 'row 5; column 1-2',
            value: 1,
            className: 'test-radio',
            callback: checkboxEvent
          }
        ],
        'row 5; column 2',
        'row 5; column 3',
        'row 5; column 4'
      ],
      {
        type: 'row',
        data: 1,
        value: 2,
        event: 'onClick',
        callback: (restData, objectUnit, event) => {
          alert('test event of row');
          console.log(restData, objectUnit, event);
        },
        className: 'click-row',
        cells: [
          [
            {
              type: 'radio',
              name: 'group2',
              text: 'radio group 2-1',
              className: 'test-radio',
              value: 'a',
              callback: checkboxEvent
            },
            {
              type: 'radio',
              name: 'group2',
              text: 'radio group 2-2',
              className: 'test-radio',
              value: 'b',
              callback: checkboxEvent
            }
          ],
          'row 6; column 2',
          'row 6; column 3',
          'row 6; column 4'
        ]
      },
      [
        [
          {
            type: 'checkbox',
            name: 'chk',
            text: 'chk1',
            value: 'chk1',
            callback: checkboxEvent
          },
          {
            type: 'checkbox',
            name: 'chk',
            text: 'chk2',
            value: 'chk2',
            callback: checkboxEvent
          },
          {
            type: 'checkbox',
            name: 'chk',
            text: 'chk3',
            value: 'chk3',
            callback: checkboxEvent
          }
        ],
        {
          type: 'link',
          text: 'I am a link',
          event: 'onClick',
          className: 'test-link',
          callback: () => {
            alert('clicked link');
          }
        },
        {
          type: 'button',
          value: 'click me',
          className: 'test-btn',
          callback: (data, cellObject, cellElement) => {
            if(!data) {
              data = 'data of button is undefined';
            }

            cellElement.target.value = 'you clicked me!!';
            cellElement.target.style.width = '150px';

            console.log(data);
            console.log(cellObject);
            console.log(cellElement);

            alert('hello react-tabllist, Please check the console');
          }
        }
      ],
      ['row 8; column 1', 'row 8; column 2', 'row 8; column 3', 'row 8; column 4'],
      ['row 9; column 1', 'row 9; column 2', 'row 9; column 3', 'row 9; column 4']
    ],
    property: {
      border: {
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#ededed'
      },
      style: {
        width: '100%',
        margin: '0 auto',
        padding: '10px',
        height: 550,
        border: '1px solid #999999'
      },
      scroll: {
        enable: true,
        speed: 50,
        distance: 1
      },
      header: {
        show: true,
        style: {
          backgroundColor: '#1693ff',
          height: 40,
          borderBottom: '1px solid #999999'
        },
        cellStyle: {
          color: '#ffffff',
          fontWeight: 'bolder',
          fontSize: 20
        }
      },
      body: {
        style: {
          padding: 0
        },
        row: {
          spacing: 0,
          style: {
            height: 34
          },
          rowCheckbox: {
            show: true,
            column: 1
          },
          serialNumber: {
            show: true,
            formatter: 'No.{index}',
            column: 1,
            style: {
              backgroundColor: '#3991ff',
              width: 80,
              fontSize: 20,
              color: '#2cff41',
              margin: '0 auto'
            },
            specialStyle: [
              { backgroundColor: '#203d7b' },
              { backgroundColor: '#2f4c99' },
              { backgroundColor: '#3960c0' }
            ]
          },
          specialStyle: [
            { height: 60 },
            { height: 100 },
            { height: 80 },
            { height: 30 },
            { height: 50 },
            { height: 80 }
          ],
          visual: {
            show: false,
            style: {
              backgroundColor: '#e8f4fc'
            }
          },
          silent: {
            show: true,
            style: {
              backgroundColor: '#bcf0fc'
            }
          }
        },
        cell: {
          style: {
            fontSize: 16,
            minWidth: 0,
            color: '#000000',
            textAlign: 'center',
            width: '80, 50, 400, ,150'
          }
        },
        cellOfColumn: {
          style: [
            {},
            {},
            { color: 'red' },
            {}
          ]
        }
      }
    }
  };

  return (
    <div className='container'>
      <Tabllist property={option.property} data={option.data} />
    </div>
  );
};

ReactDOM.render(
  <Dev />,
  document.getElementById('root')
);
