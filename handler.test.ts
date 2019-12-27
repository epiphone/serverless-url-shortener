import axios from 'axios' // tslint:disable-line:no-implicit-dependencies

describe('handler', () => {
  it('returns HTTP 200 from root handler', async () => {
    const res = await axios.get('localhost:3000/hello')

    expect(res.status).toBe(200)
    expect(res.data.message).toBeDefined()
  })
})
