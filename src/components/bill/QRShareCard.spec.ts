import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import QRShareCard from './QRShareCard.vue'

const qrCodeMock = vi.hoisted(() => ({
  toDataURL: vi.fn(),
}))

vi.mock('qrcode', () => ({
  default: qrCodeMock,
}))

describe('QRShareCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    qrCodeMock.toDataURL.mockResolvedValue('data:image/png;base64,qr')
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders the generated QR through an image data URL instead of injected HTML', async () => {
    const wrapper = mount(QRShareCard, {
      props: { shareUrl: 'https://duit.example/guest/bills/share-token' },
    })
    await flushPromises()

    const image = wrapper.get('img[alt="QR code for the guest bill share link"]')
    expect(image.attributes('src')).toBe('data:image/png;base64,qr')
    expect(wrapper.html()).not.toContain('<svg')
    expect(qrCodeMock.toDataURL).toHaveBeenCalledWith(
      'https://duit.example/guest/bills/share-token',
      expect.objectContaining({ width: 220 }),
    )
  })

  it('keeps the share link copyable when QR generation fails', async () => {
    qrCodeMock.toDataURL.mockRejectedValueOnce(new Error('qr failed'))
    const wrapper = mount(QRShareCard, {
      props: { shareUrl: 'https://duit.example/guest/bills/share-token' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('QR image could not be generated')
    await wrapper.get('button').trigger('click')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://duit.example/guest/bills/share-token')
  })
})
